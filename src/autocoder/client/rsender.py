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


# wait until the server is running
import time
while True:
    try:
        response = requests.get("http://localhost:8000")
        if response.status_code == 200:
            break
    except requests.exceptions.ConnectionError:
        print("Server not running yet. Waiting...")
        time.sleep(1)

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

click_delay = 0.3
def setup():
    
    # close the current window
    r = sender.hotkey("ctrl", "w")
    print(r)

    time.sleep(click_delay)
    settings = [
        "cline.autocoder.yoloMode",
        "cline.autocoder.disableNotifications",
        "cline.autocoder.enableAnthropicProvider",
#        "cline.autocoder.setInstructions",
        "cline.autocoder.disableTelemetry"
    ]
    for s in settings:
        r = sender.vscode(s)
        print(r)
        time.sleep(click_delay)

    v = sender.vscode("cline.autocoder.setAnthropicKey")
    time.sleep(click_delay)

    #import os
    #api_key = os.environ.get("ANTHROPIC_API_KEY")
    api_key = "sk-"
    s = sender.text(api_key+"\n")
    print(s)
    time.sleep(click_delay)
    v = sender.vscode("cline.autocoder.setAnthropicModel")
    time.sleep(click_delay)
    s = sender.text("claude-3-5-sonnet-20241022\n")

    # cline.autocoder.setAnthropicModel
    # cline.autocoder.setAnthropicKey

    v = sender.vscode("workbench.action.terminal.new")
    print(v)
    time.sleep(click_delay)

    z = sender.text("code -a --no-sandbox /project\n")
    print(z)
    time.sleep(3*click_delay)

    # set focus on cline
    # error sending multiple commands ??
    v = sender.vscode("workbench.view.extension.claude-dev-ActivityBar")
    print(v)
    time.sleep(click_delay)


def set_theme():
    sender.vscode("workbench.action.selectTheme")
    time.sleep(1)
    sender.text("Dark+ (default dark)")
    time.sleep(1)

def send_task(task):
    # Type your task here.
    # ype your task here.
    task_text = "your task here."
    c = sender.click(task_text)
    print(c)

    t = sender.text(task)
    print(t)


# check the cli options for --setup
import sys
if "--setup" in sys.argv:
    setup()
    time.sleep(2)
    exit(0)

# read the task from a file provided as an argument
# by default it is named task-file

# read task from a file task.md
task_file = "task.md"
# open task_file
task = None
with open(task_file, "r", encoding="utf-8") as f:
    task = f.read()

# .clinerules

if (task):
    print("task read from file")
    done_text = """As a final instruction. When you have built the code according to the instructions, create a file done.txt. But only if you are finished.
"""
    send_task( task+"\n "+done_text +"\n")
