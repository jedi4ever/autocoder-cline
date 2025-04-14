import pyautogui

z = pyautogui.screenshot()
z.save("screenshot.png")
print(z)
#items = pyautogui.locateOnScreen('typemessage.png')
#print(items)

# https://www.codespeedy.com/detect-text-from-the-screen-and-click-on-it/

import pytesseract

# Use Tesseract to extract text from the screenshot
text_data = pytesseract.image_to_data(z, output_type=pytesseract.Output.DICT)
target_text = "type a message"
target_text = "type your task"


words = target_text.split(" ")
word_counter = 1
# Loop through all detected text
#  to find coordinates of the target text
for i, text in enumerate(text_data['text']):
    word = words[word_counter-1]
    if text.lower() == words[word_counter-1].lower():
        print("found word",text)
        word_counter=word_counter+1

    if word_counter != len(words):
        continue
    else:
        print("final word found")
    
    if word.lower() in text.lower():
        x = text_data['left'][i]
        y = text_data['top'][i]
        width = text_data['width'][i]
        height = text_data['height'][i]
        
        # Calculate the center of the text
        center_x = x + width // 2
        center_y = y + height // 2

        # Move the mouse to the center of the text and click
        pyautogui.moveTo(center_x, center_y)
        pyautogui.click()
        print(f"Clicked on text '{target_text}' at ({center_x}, {center_y})")
        break
else:
    print(f"Text '{target_text}' not found on the screen.")
