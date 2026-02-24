import json
import re

def fix_json():
    with open('Cat_Data.json', 'r') as f:
        content = f.read()

    # Find the split between the two JSON objects
    # Count braces to find the end of the first object
    stack = 0
    split_index = -1
    for i, char in enumerate(content):
        if char == '{':
            stack += 1
        elif char == '}':
            stack -= 1
            if stack == 0:
                split_index = i + 1
                break
    
    if split_index == -1:
        print("Error: Could not find separation between JSON objects. Maybe valid JSON?")
        # Just try to parse the whole thing
        try:
            data = json.loads(content)
            print("File is already valid JSON.")
            return
        except:
             print("File is invalid JSON but could not find two distinct objects.")
             return

    part1 = content[:split_index]
    part2 = content[split_index:].strip()

    print(f"Split at index {split_index}")

    try:
        data1 = json.loads(part1)
        if part2:
            data2 = json.loads(part2)
        else:
             print("Second part is empty. Nothing to merge.")
             return
    except json.JSONDecodeError as e:
        print(f"JSON Decode Error: {e}")
        return

    # Merge population_history
    history_map = {item['common_name']: item.get('population_history') for item in data2.get('species_list', [])}

    count = 0
    if 'species_list' in data1:
        for species in data1['species_list']:
            common_name = species['common_name']
            
            # Find history
            history = history_map.get(common_name)
            
            # Try fuzzy match if exact fails
            if not history:
                 for k, v in history_map.items():
                     if (k in common_name or common_name in k):
                         history = v
                         break
            
            if history:
                species['population_history'] = history
                count += 1
            else:
                print(f"Warning: No population history for {common_name}")

    print(f"Merged {count} population histories.")

    with open('Cat_Data.json', 'w') as f:
        json.dump(data1, f, indent=2)
    
    print("Successfully saved Cat_Data.json")

if __name__ == '__main__':
    fix_json()
