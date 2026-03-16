import os

def find_null_bytes(root_dir):
    for root, dirs, files in os.walk(root_dir):
        if '.git' in dirs:
            dirs.remove('.git')
        if 'node_modules' in dirs:
            dirs.remove('node_modules')
        
        for file in files:
            if file.endswith(('.png', '.ico', '.svg', '.jpg', '.jpeg', '.pyc', '.git')):
                continue
            
            filepath = os.path.join(root, file)
            try:
                with open(filepath, 'rb') as f:
                    if b'\x00' in f.read():
                        print(f"FOUND NULL BYTES: {filepath}")
            except Exception as e:
                pass

find_null_bytes('.')
