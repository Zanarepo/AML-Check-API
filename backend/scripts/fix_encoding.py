import os

files_to_check = [
    'requirements.txt',
    'api/index.py',
    'backend/app/main.py',
    'backend/app/api/dependencies.py',
    'backend/app/core/config.py'
]

for file_path in files_to_check:
    if os.path.exists(file_path):
        with open(file_path, 'rb') as f:
            content = f.read()
            if b'\x00' in content:
                print(f"!!! CRITICAL: Null bytes found in {file_path}")
                # Try to fix by writing as UTF-8
                text = content.decode('utf-16' if content.startswith(b'\xff\xfe') or content.startswith(b'\xfe\xff') else 'utf-8', errors='ignore')
                with open(file_path, 'w', encoding='utf-8', newline='\n') as fout:
                    fout.write(text.replace('\r\n', '\n'))
                print(f"Fixed {file_path} by re-encoding to clean UTF-8.")
            else:
                print(f"OK: {file_path} is clean.")
    else:
        print(f"SKIP: {file_path} does not exist.")
