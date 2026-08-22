import requests
import time
import os
import re

# Configuration
BOOKS = {
    "Matthew": {"id": 40, "chapters": 28},
    "Mark": {"id": 41, "chapters": 16},
    "Luke": {"id": 42, "chapters": 24},
    "John": {"id": 43, "chapters": 21} 
}
VERSION = "ISV"
OUTPUT_DIR = "Gospels-ISV"

# Create output directory if it doesn't exist
os.makedirs(OUTPUT_DIR, exist_ok=True)

def fetch_chapter(book_name, book_id, chapter):
    """Fetches a specific chapter from the Bolls.life API."""
    url = f"https://bolls.life/get-text/{VERSION}/{book_id}/{chapter}/"
    try:
        response = requests.get(url, timeout=10)
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        print(f"\nError fetching {book_name} chapter {chapter}: {e}")
        return None

def format_to_markdown(book_name, chapter, verses):
    """Formats the JSON verse data into clean Markdown."""
    md_content = f"## Chapter {chapter}\n\n"
    for verse_data in verses:
        verse_num = verse_data["verse"]
        text = normalize_annotation_markup(verse_data["text"].strip())
        text = escape_mdx_literal_braces(text)
        # Format as bold verse number followed by the text
        md_content += f"**{verse_num}** {text}\n\n"
    return md_content


def normalize_annotation_markup(text):
    """Repair the API's malformed annotation tags before Markdown compilation."""
    # One source annotation contains ``n>{...}</sup>`` instead of an opening tag.
    text = text.replace("n>{", "<sup>{")

    # Footnote annotations should not nest <sup> tags. Preserve the inner text
    # while dropping nested or unmatched tags so MDX receives valid HTML.
    parts = re.split(r"(</?sup>)", text)
    normalized = []
    sup_depth = 0
    for part in parts:
        if part == "<sup>":
            if sup_depth == 0:
                normalized.append(part)
                sup_depth = 1
        elif part == "</sup>":
            if sup_depth:
                normalized.append(part)
                sup_depth = 0
        else:
            normalized.append(part)

    if sup_depth:
        normalized.append("</sup>")

    return "".join(normalized)


def escape_mdx_literal_braces(text):
    """Keep API footnotes literal instead of letting MDX parse them as expressions."""
    return text.replace("{", "&#123;").replace("}", "&#125;")

def main():
    print(f"Starting download of Synoptic Gospels in {VERSION}...")
    print(f"Files will be saved in the './{OUTPUT_DIR}/' folder.\n")
    
    for book_name, info in BOOKS.items():
        book_id = info["id"]
        total_chapters = info["chapters"]
        filename = os.path.join(OUTPUT_DIR, f"{book_name}-{VERSION}.md")
        
        print(f"Downloading {book_name} ({total_chapters} chapters)...")
        
        with open(filename, "w", encoding="utf-8") as f:
            # Write book header
            f.write(f"# {book_name} (ISV)\n\n")
            
            for chapter in range(1, total_chapters + 1):
                print(f"  Fetching chapter {chapter}/{total_chapters}...", end="\r")
                verses = fetch_chapter(book_name, book_id, chapter)
                
                if verses:
                    md_chapter = format_to_markdown(book_name, chapter, verses)
                    f.write(md_chapter)
                
                # Polite delay to avoid overwhelming the free API
                time.sleep(0.3)
            
            print(f"  ✅ Finished {book_name}. Saved to {filename}")

    print("\n🎉 Download complete! Check the 'Gospels-ISV' folder for your Markdown files.")

if __name__ == "__main__":
    main()
