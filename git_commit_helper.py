import subprocess

subprocess.run(["git", "add", "."], check=True)
subprocess.run(["git", "commit", "-m", "Initial commit: AquaBuddy Dive App V670"], check=True)
print("Git commit successful!")
