import os
import re

directory = '/Users/zndr/Documents/AppDev-KdramaWatchlist/backend/tests/Feature'
for filename in os.listdir(directory):
    if filename.endswith('.php'):
        filepath = os.path.join(directory, filename)
        with open(filepath, 'r') as f:
            content = f.read()
        
        content = re.sub(r'Tracker::create\(', '$this->createTestTracker(', content)
        
        with open(filepath, 'w') as f:
            f.write(content)
