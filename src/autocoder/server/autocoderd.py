from fastapi import FastAPI
from pydantic import BaseModel
import uvicorn
import pyautogui
import pytesseract
import asyncio
import json

from typing import List

from websockets.asyncio.client import connect

class RemoteVSCode:
    def __init__(self):
        self.uri = "ws://localhost:3710"

    # dont use this inside of fadtapi
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

def find_text(target_text):
    z = pyautogui.screenshot()
    #z.save("screenshot.png")
    #print(z)
    #items = pyautogui.locateOnScreen('typemessage.png')
    #print(items)

    # https://www.codespeedy.com/detect-text-from-the-screen-and-click-on-it/

    # Use Tesseract to extract text from the screenshot
    text_data = pytesseract.image_to_data(z, output_type=pytesseract.Output.DICT)

    words = target_text.split(" ")
    matched_word_counter = 0
    found= False
    # Loop through all detected text
    #  to find coordinates of the target text

    for i, text in enumerate(text_data['text']):
        
        next_word = words[matched_word_counter]

        if text.lower() == next_word.lower():
            print("found next word",text)
            matched_word_counter=matched_word_counter+1

            if matched_word_counter == len(words):
                print("all words found")
                found = True
                # we're done
                break
        else:
            # we did not find the next word
            # so we reset our counter
            print(f"skipping {text}")
            matched_word_counter = 0
    return found

def click_text(target_text):
    z = pyautogui.screenshot()
    #z.save("screenshot.png")
    #print(z)
    #items = pyautogui.locateOnScreen('typemessage.png')
    #print(items)

    # https://www.codespeedy.com/detect-text-from-the-screen-and-click-on-it/

    # Use Tesseract to extract text from the screenshot
    text_data = pytesseract.image_to_data(z, output_type=pytesseract.Output.DICT)

    words = target_text.split(" ")
    matched_word_counter = 0
    result= f"Text '{target_text}' not found on the screen."
    # Loop through all detected text
    #  to find coordinates of the target text

    for i, text in enumerate(text_data['text']):
        
        next_word = words[matched_word_counter]

        if text.lower() == next_word.lower():
            print("found next word",text)
            matched_word_counter=matched_word_counter+1

            if matched_word_counter == len(words):
                print("all words found")
                # now click on the last word found
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
                result = f"Clicked on text '{target_text}' at ({center_x}, {center_y})"
                # we're done
                break
        else:
            # we did not find the next word
            # so we reset our counter
            print(f"skipping {text}")
            matched_word_counter = 0
    return result

# Models
class TextCommand(BaseModel):
    """
    Model for the command request body.
    """
    command: str

class TextCommandResponse(BaseModel):
    """
    Model for the command response.
    """
    echo: str

class HotCommand(BaseModel):
    """
    Model for the command request body.
    """
    command: List[str]

class HotCommandResponse(BaseModel):
    """
    Model for the command response.
    """
    echo: str

class ClickCommand(BaseModel):
    """
    Model for the command request body.
    """
    command: str

class ClickCommandResponse(BaseModel):
    """
    Model for the command response.
    """
    echo: str

class FindTextCommand(BaseModel):
    """
    Model for the command request body.
    """
    command: str

class FindTextCommandResponse(BaseModel):
    """
    Model for the command response.
    """
    echo: bool

class VSCodeCommand(BaseModel):
    """
    Model for the command request body.
    """
    command: str
    args: str

class VSCodeCommandResponse(BaseModel):
    """
    Model for the command response.
    """
    echo: str


# Create FastAPI instance
app = FastAPI(
    title="Echo API",
    description="A simple API that echoes back commands",
    version="1.0.0"
)

# curl -X "POST" "localhost:8000/echo" -H "accept: application/json" -H "Content-Type: application/json" -d "{\"command\": \"bar\"}"
# WARNING:  Unsupported upgrade request.
# WARNING:  No supported WebSocket library detected. Please use "pip install 'uvicorn[standard]'", or install 'websockets' or 'wsproto' manually.

@app.get("/")
async def root():
    """
    Root endpoint that returns a welcome message.
    
    Returns:
        dict: A welcome message
    """
    return {"message": "Welcome to the AutocoderD API!"}

@app.post("/text", response_model=TextCommandResponse)
async def text_command(command: TextCommand) -> TextCommandResponse:
    """
    Endpoint that echoes back the received command.
    
    Args:
        command (Command): The command to echo back
        
    Returns:
        CommandResponse: The echoed command
    """

    pyautogui.write(command.command)

    return TextCommandResponse(echo=command.command)

@app.post("/hotkey", response_model=HotCommandResponse)
async def hotkey_command(command: HotCommand) -> HotCommandResponse:
    """
    Endpoint that echoes back the received command.
    
    Args:
        command (Command): The command to echo back
        
    Returns:
        CommandResponse: The echoed command
    """

    pyautogui.hotkey(*command.command)

    rall= ' '.join(command.command)
    return HotCommandResponse(echo=rall)

# curl -X "POST" "localhost:8000/click" -H "accept: application/json" -H "Content-Type: application/json" -d "{\"command\": \"use your own api key\" }"
@app.post("/click", response_model=ClickCommandResponse)
async def click_command(command: ClickCommand) -> ClickCommandResponse:
    """
    Endpoint that echoes back the received command.
    
    Args:
        command (Command): The command to echo back
        
    Returns:
        CommandResponse: The echoed command
    """
    result = click_text(command.command)
    return ClickCommandResponse(echo=result)

@app.post("/find", response_model=FindTextCommandResponse)
async def find_command(command: FindTextCommand) -> FindTextCommandResponse:
    """
    Endpoint that echoes back the received command.
    
    Args:
        command (Command): The command to echo back
        
    Returns:
        CommandResponse: The echoed command
    """
    result = find_text(command.command)
    return FindTextCommandResponse(echo=result)

# curl -X "POST" "localhost:8000/vscode" -H "accept: application/json" -H "Content-Type: application/json" -d "{\"command\": \"terminal.execute\", \"args\":\"ls -l\" }"
@app.post("/vscode", response_model=ClickCommandResponse)
async def vscode_command(command: VSCodeCommand) -> VSCodeCommandResponse:
    """
    Endpoint that echoes back the received command.
    
    Args:
        command (Command): The command to echo back
        
    Returns:
        CommandResponse: The echoed command
    """
    remoter = RemoteVSCode()
    await remoter.ws_send(command.command, command.args)
    result = f"vscode command {command.command} sent."
    return VSCodeCommandResponse(echo=result)

if __name__ == "__main__":
    import sys
    
    uvicorn.run(app, host="0.0.0.0", port=8000)