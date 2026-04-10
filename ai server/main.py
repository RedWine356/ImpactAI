from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from transformers import AutoTokenizer, AutoModelForCausalLM
import torch

app = FastAPI()

print("Loading model... This might take a minute.")
model_name = "HuggingFaceH4/tiny-random-LlamaForCausalLM"
tokenizer = AutoTokenizer.from_pretrained(model_name)
if tokenizer.pad_token is None:
    tokenizer.pad_token = tokenizer.eos_token
model = AutoModelForCausalLM.from_pretrained(model_name)
device = "cuda" if torch.cuda.is_available() else "cpu"
model.to(device)
print("Model loaded successfully!")

class AskRequest(BaseModel):
    prompt: str
    model: str = model_name

class AskResponse(BaseModel):
    id: int
    prompt: str
    response: str
    model: str

class UpdateRequest(BaseModel):
    prompt: str

# In-memory database for CRUD operations
prompt_history = {}
current_id = 1

def generate_text(prompt: str) -> str:
    inputs = tokenizer(prompt, return_tensors="pt").to(device)
    outputs = model.generate(**inputs, max_new_tokens=50, pad_token_id=tokenizer.eos_token_id)
    return tokenizer.decode(outputs[0], skip_special_tokens=True)

@app.post("/ask", response_model=AskResponse)
def create_ask(request: AskRequest):
    global current_id
    try:
        generated_text = generate_text(request.prompt)

        record = AskResponse(
            id=current_id,
            prompt=request.prompt,
            response=generated_text,
            model=request.model
        )
        prompt_history[current_id] = record
        current_id += 1
        return record
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/history", response_model=list[AskResponse])
def read_all_history():
    return list(prompt_history.values())

@app.get("/history/{item_id}", response_model=AskResponse)
def read_history(item_id: int):
    if item_id not in prompt_history:
        raise HTTPException(status_code=404, detail="Item not found")
    return prompt_history[item_id]

@app.put("/history/{item_id}", response_model=AskResponse)
def update_history(item_id: int, request: UpdateRequest):
    if item_id not in prompt_history:
        raise HTTPException(status_code=404, detail="Item not found")
    
    record = prompt_history[item_id]
    
    try:
        generated_text = generate_text(request.prompt)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    record.prompt = request.prompt
    record.response = generated_text
    prompt_history[item_id] = record
    return record

@app.delete("/history/{item_id}")
def delete_history(item_id: int):
    if item_id not in prompt_history:
        raise HTTPException(status_code=404, detail="Item not found")
    del prompt_history[item_id]
    return {"message": "Item deleted successfully"}

@app.get("/")
def read_root():
    return {"message": "AI Server is running"}
