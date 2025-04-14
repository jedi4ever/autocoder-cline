import asyncio
import json

from websockets.asyncio.client import connect

# echo "{ \"command\": \"workbench.action.terminal.new\" }" | websocat ws://localhost:3710

#json_command = "{ \"command\": \"workbench.action.terminal.new\" }"
#json_command = "{ \"command\": \"aichat.show-ai-chat\" }"
#aichat.show-ai-chat

class RemoteVSCode:
    def __init__(self):
        self.uri = "ws://localhost:3710"

    def execute_command(self, cmd, cmd_args=None):
        asyncio.run(self.ws_send(cmd, cmd_args))

    async def ws_send(self, cmd, cmd_args=None):

        if cmd_args:
            json_command = {
                "command": cmd,
                "args": cmd_args
            }
        else:
            json_command = {
                "command": cmd
            }

        async with connect(self.uri) as websocket:
            await websocket.send(json.dumps(json_command))
            print(f">>> {json.dumps(json_command)}")
            print("Message sent. Closing connection.")
            await websocket.close()
    
remoter = RemoteVSCode()

# command handled by modified extension
# #json_command = "{ \"command\": \"workbench.action.terminal.new\" }"
remoter.execute_command("workbench.action.terminal.new")

remoter.execute_command("terminal.execute","ls -l")

