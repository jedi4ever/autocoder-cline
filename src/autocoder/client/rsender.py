import requests
import json

class RSender():

    url = "localhost:8000"

    def __init__(self):
        pass

    def send(self, action, data):
        """
        Send data to the server.
        :param data: The data to send.
        :return: The response from the server.
        """

        headers = {
            'Content-Type': 'application/json'
        }

        # Construct the URL
        action_url = f"http://{self.url}/{action}"
        response = requests.post(action_url, headers=headers, data=json.dumps(data))

        return response.json()
    
    def vscode(self, command):
        return self.send("vscode", {
            "command": command, 
            "args": ""
            }
        )

    def click(self, command):
        return self.send("click", {
            "command": command
            }
        )

    def find(self, command):
        return self.send("find", {
            "command": command
            }
        )

    def text(self, command):
        return self.send("text", {
            "command": command
            }
        )
    
    # allow to specificy multiple arguments to hotkey
    # e.g. hotkey("ctrl", "c")
    # e.g. hotkey("ctrl", "shift", "c")
    # e.g. hotkey("ctrl", "alt", "c")
    def hotkey(self, *args):
        return self.send("hotkey", {
            "command": args
            }
        )

sender = RSender()
#z = sender.find("Install nodejs")
#print(z)
#v = sender.vscode("workbench.action.terminal.new")
#print(v)

import time
time.sleep(1)

#v = sender.vscode("workbench.view.extension.claude-dev-ActivityBar")
#print(v)


#t = sender.text("ls -l\n")
#print(t)


def setup():
    # close the current window
    r = sender.hotkey("ctrl", "w")
    print(r)

    # setup anthropic
    v = sender.vscode("cline.patrick")
    print(v)
    time.sleep(1)

    v = sender.vscode("workbench.action.terminal.new")
    print(v)
    time.sleep(1)

    z = sender.text("code -a --no-sandbox /project\n")
    print(z)
    time.sleep(1)

    # set focus on cline
    # error sending multiple commands ??
    v = sender.vscode("workbench.view.extension.claude-dev-ActivityBar")
    print(v)
    time.sleep(1)


def set_theme():
    sender.vscode("workbench.action.selectTheme")
    time.sleep(1)
    sender.text("Dark+ (default dark)")
    time.sleep(1)

def send_task():
    c = sender.click("Type your task")
    print(c)

    task = """
    - A cli tool that fetches data from a google sheet.
    - The data should be stored in a json file.
    - You can pass the google sheet url as an argument to the cli tool.

    """
    t = sender.text(task)
    print(t)

setup()
time.sleep(2)
send_task()
