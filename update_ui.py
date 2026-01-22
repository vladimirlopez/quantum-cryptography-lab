import sys
import os

file_path = 'index.html'

try:
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. Remove Lab Equipment Section
    # Look for the start marker
    start_marker = '<!-- Left: Equipment Visual (Pictorial) -->'
    # Look for the next marker which is the Right Instructional Text
    right_marker = '<!-- Right: Instructional Text -->'
    
    start_idx = content.find(start_marker)
    end_idx = content.find(right_marker, start_idx)
    
    if start_idx != -1 and end_idx != -1:
        print("Found Lab Equipment section. Removing...")
        # Remove from start_marker up to just before right_marker (keeping right_marker and indentation if any leading)
        # However, start_marker usually has indentation before it. content.find finds the start of the string.
        # We should check if there's indentation before start_marker we want to keep or remove?
        # Usually we want to remove the whole block line-wise.
        # Let's just splice strings. 
        # Check previous newline to remove empty line if desired, but sticking to exact string splice is safer for now.
        content = content[:start_idx] + content[end_idx:]
    else:
        print("Lab Equipment section not found or markers mismatch.")

    # 2. Update col-span-7 to col-span-12
    # This is specific to the instructional text container
    target_str = 'md:col-span-7'
    # We want to replace it specifically in the context if possible, or global if unique.
    # verify count
    count = content.count(target_str)
    print(f"Found {count} occurrences of {target_str}")
    if count > 0:
        content = content.replace(target_str, 'md:col-span-12')
        print("Updated col-span-7 to col-span-12")

    # 3. Remove Download Button Section
    start_download = '<!-- Download Button Section -->'
    # We find the closing section tag for this block
    # It contains a button with id="downloadBtn" so that confirms we are in the right block if we want to be sure.
    start_dl_idx = content.find(start_download)
    if start_dl_idx != -1:
        # Find </section> after this
        end_dl_idx = content.find('</section>', start_dl_idx)
        if end_dl_idx != -1:
            end_dl_idx += len('</section>')
            print("Found Download Button section. Removing...")
            content = content[:start_dl_idx] + content[end_dl_idx:]
        else:
            print("Could not find closing section for download button.")
    else:
        print("Download Button section not found.")

    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)
    print("Successfully updated index.html")

except Exception as e:
    print(f"Error: {e}")
