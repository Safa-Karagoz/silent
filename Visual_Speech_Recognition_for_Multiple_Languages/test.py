import torch
print(f"PyTorch version: {torch.__version__}")
print(f"MPS available: {torch.backends.mps.is_available()}")
print(f"MPS built with Metal: {torch.backends.mps.is_built()}")
print(torch.__version__) 