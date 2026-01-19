#!/bin/bash
# Run discourse fix script every hour for 4 hours

echo "Starting hourly Discourse fix schedule..."
echo "Will run 4 times, once per hour"

for i in 1 2 3 4; do
    echo ""
    echo "=============================================="
    echo "Run $i of 4 - $(date)"
    echo "=============================================="
    
    python3 /home/runner/workspace/fix_discourse_comments.py
    
    if [ $i -lt 4 ]; then
        echo ""
        echo "Waiting 1 hour before next run..."
        sleep 3600
    fi
done

echo ""
echo "=============================================="
echo "All 4 scheduled runs completed at $(date)"
echo "=============================================="
