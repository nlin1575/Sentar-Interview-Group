"""
Read a sentence from STDIN, write a JSON array of 384 floats to STDOUT.
"""
import sys, json
from sentence_transformers import SentenceTransformer

model = SentenceTransformer("all-MiniLM-L6-v2")   # 384-dim MiniLM

def main():
    text = sys.stdin.read()
    vec  = model.encode(text, normalize_embeddings=True).tolist()
    print(json.dumps(vec))

if __name__ == "__main__":
    main()
