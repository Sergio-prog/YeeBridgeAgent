#!/bin/bash

curl -L https://github.com/jmorganca/ollama/releases/download/v0.1.46/ollama-darwin -o ollama

chmod +x ollama

sudo mv ollama /usr/local/bin/

nohup /usr/local/bin/ollama serve > /dev/null 2>&1 &
/usr/local/bin/ollama pull llama3
/usr/local/bin/ollama pull nomic-embed-text
