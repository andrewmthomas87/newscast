import ClassCode as code
import sys
import json

try:
    print("here")
    avatar = "news"

    code.purge(avatar)
    code.resetTriggers()

    # Read JSON string from stdin
    json_string = sys.stdin.read()

    # Load JSON string into a Python object
    data = json.loads(json_string)
    print(data)

    # Extract the string
    paragraph = data.get('data')

    if paragraph is not None:
        trigger = code.paragraphSpeak(paragraph, avatar, "Free Trigger")
        print("The speaker has begun.")
        code.waitUntilOver(trigger)
        print("The speaker has ended.")
    else:
        print("Error: 'data' key not present in the JSON object.")

except Exception as e:
    print(f"Error in Python script: {str(e)}")
    sys.stdout.flush()