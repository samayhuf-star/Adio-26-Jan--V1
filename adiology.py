#!/usr/bin/env python3
"""
Adiology - Medical Imaging Analysis System
A simple application for processing and analyzing medical images
"""

import sys
from datetime import datetime


class AdiologySystem:
    """Main class for the Adiology medical imaging system"""
    
    def __init__(self):
        self.name = "Adiology"
        self.version = "1.0.0"
        self.date = "14-Jan-2026"
        self.images = []
        
    def add_image(self, image_path, patient_id, image_type):
        """Add a medical image to the system"""
        image_data = {
            'path': image_path,
            'patient_id': patient_id,
            'type': image_type,
            'timestamp': datetime.now().isoformat()
        }
        self.images.append(image_data)
        return len(self.images) - 1
    
    def get_image(self, image_id):
        """Retrieve an image by ID"""
        if 0 <= image_id < len(self.images):
            return self.images[image_id]
        return None
    
    def list_images(self):
        """List all images in the system"""
        return self.images
    
    def analyze_image(self, image_id):
        """Perform basic analysis on an image"""
        image = self.get_image(image_id)
        if image:
            analysis = {
                'image_id': image_id,
                'patient_id': image['patient_id'],
                'type': image['type'],
                'status': 'analyzed',
                'timestamp': datetime.now().isoformat()
            }
            return analysis
        return None
    
    def get_info(self):
        """Get system information"""
        return f"{self.name} v{self.version} - {self.date}"


def main():
    """Main entry point for the application"""
    print("=" * 50)
    print("Adiology - Medical Imaging Analysis System")
    print("=" * 50)
    
    system = AdiologySystem()
    print(f"\n{system.get_info()}")
    print(f"System initialized successfully!")
    print(f"Total images: {len(system.list_images())}")
    
    # Example usage
    if len(sys.argv) > 1 and sys.argv[1] == "demo":
        print("\n--- Running Demo ---")
        
        # Add sample images
        img1 = system.add_image("/path/to/xray1.dcm", "P001", "X-Ray")
        print(f"Added image {img1}: X-Ray for patient P001")
        
        img2 = system.add_image("/path/to/ct1.dcm", "P002", "CT Scan")
        print(f"Added image {img2}: CT Scan for patient P002")
        
        # List all images
        print("\nAll images in system:")
        for idx, img in enumerate(system.list_images()):
            print(f"  {idx}: {img['type']} - Patient {img['patient_id']}")
        
        # Analyze an image
        analysis = system.analyze_image(0)
        if analysis:
            print(f"\nAnalysis result: {analysis}")
    
    print("\n" + "=" * 50)
    return 0


if __name__ == "__main__":
    sys.exit(main())
