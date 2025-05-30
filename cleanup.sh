#!/bin/bash

# Remove node_modules/ if it exists in the current directory
if [ -d "node_modules" ]; then
    echo "Removing node_modules/..."
    rm -rf node_modules/
    echo "node_modules/ removed."
else
    echo "node_modules/ not found in current directory."
fi

# Remove dist/ if it exists in the current directory
if [ -d "dist" ]; then
    echo "Removing dist/..."
    rm -rf dist/
    echo "dist/ removed."
else
    echo "dist/ not found in current directory."
fi

# Run cargo clean in the current directory if it's a Rust project
if [ -d "src-tauri" ]; then
    echo "Running cargo clean..."
     (cd src-tauri && cargo clean)
    echo "cargo clean completed."
else
    echo "No src-tauri directory found in current directory."
fi

echo "Cleanup completed."
