import pyautogui


class KeyboardSender:

    def __init__(self):
        pass

    def hot_key(self, *args):
        pyautogui.hotkey(*args)

    def write(self, text):
        pyautogui.write(text)

    def press(self, key):
        pyautogui.press(key)

sender=KeyboardSender()
sender.write("Write me a hello world nodejs app\n")