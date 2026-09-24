import subprocess
import os

def main():
    with open('untracked_files.txt', 'r', encoding='utf-8') as f:
        files = [line.strip() for line in f if line.strip()]

    chunk_size = 500
    num_commits = 20

    print(f"Total files available: {len(files)}")
    
    # We only process up to num_commits * chunk_size
    for i in range(14, num_commits):
        start = i * chunk_size
        end = start + chunk_size
        chunk = files[start:end]
        if not chunk:
            break
            
        print(f"Adding {len(chunk)} files for commit {i+1}...")
        
        with open('temp_chunk.txt', 'w', encoding='utf-8') as temp:
            temp.write('\n'.join(chunk))
            
        # Use git add with pathspec from file to avoid cmd length issues
        subprocess.run(['git', 'add', '--pathspec-from-file=temp_chunk.txt'], check=True)
        
        # Make a somewhat meaningful commit message based on the common path prefix
        first_file = chunk[0]
        directory = os.path.dirname(first_file) or 'root'
        msg = f"feat(core-auth): add {len(chunk)} components for auth flow in {directory} - batch {i+1}"
        
        subprocess.run(['git', 'commit', '-m', msg], check=True)

    print("Pushing to feature/core-auth...")
    subprocess.run(['git', 'push', '-u', 'origin', 'feature/core-auth'])
    print("Done.")

if __name__ == '__main__':
    main()
