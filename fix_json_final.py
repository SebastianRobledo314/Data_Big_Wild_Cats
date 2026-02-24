import json

def fix_json_final():
    with open('Cat_Data.json', 'r') as f:
        content = f.read()

    # The file contains two JSON objects back-to-back: {...}\n{...}
    # We need to find the split point. 
    # Attempt to split by closing brace followed by newline and opening brace, 
    # or just closing brace and opening brace.
    
    # Simple strategy: Find the index where the first valid JSON object ends.
    decoder = json.JSONDecoder()
    try:
        obj1, end_idx = decoder.raw_decode(content)
        print(f"First object loaded. Ends at index {end_idx}")
    except json.JSONDecodeError as e:
        print(f"Error decoding first object: {e}")
        return

    # Try to find the second object in the remaining content
    remaining = content[end_idx:].strip()
    if not remaining:
        print("No second object found. File might be single valid JSON already?")
        # Just to be safe, write obj1 back formatted
        with open('Cat_Data.json', 'w') as f:
            json.dump(obj1, f, indent=2)
        return

    try:
        obj2, _ = decoder.raw_decode(remaining)
        print("Second object loaded.")
    except json.JSONDecodeError as e:
        # If the second part isn't valid JSON, we might have issues.
        # But looking at previous output, it looked like a valid full structure.
        print(f"Error decoding second object: {e}")
        # Try to proceed with just obj1 if obj2 is garbage? 
        # But the user said they updated the file, so obj2 probably has the new data.
        return

    # Merge logic:
    # We want obj1 to keep its structure, but update 'species_list' items with 'population_history' from obj2
    
    # Create a map of common_name -> species_data from obj2
    map_obj2 = {}
    if 'species_list' in obj2:
        for s in obj2['species_list']:
            map_obj2[s.get('common_name')] = s

    # Update obj1
    count = 0
    if 'species_list' in obj1:
        for s in obj1['species_list']:
            cname = s.get('common_name')
            if cname in map_obj2:
                # Update population_history if available
                if 'population_history' in map_obj2[cname]:
                    s['population_history'] = map_obj2[cname]['population_history']
                    count += 1
            else:
                print(f"Warning: {cname} not found in second dataset.")
    
    print(f"Updated {count} species records.")

    # Write the merged result (obj1) back to file
    with open('Cat_Data.json', 'w') as f:
        json.dump(obj1, f, indent=2)
    
    print("Fixed Cat_Data.json successfully.")

if __name__ == '__main__':
    fix_json_final()
