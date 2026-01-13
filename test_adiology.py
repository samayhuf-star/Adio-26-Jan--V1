#!/usr/bin/env python3
"""
Test suite for the Adiology system
"""

import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from adiology import AdiologySystem


def test_system_initialization():
    """Test that the system initializes correctly"""
    system = AdiologySystem()
    assert system.name == "Adiology"
    assert system.version == "1.0.0"
    assert system.date == "14-Jan-2026"
    assert len(system.images) == 0
    print("✓ System initialization test passed")


def test_add_image():
    """Test adding an image to the system"""
    system = AdiologySystem()
    image_id = system.add_image("/path/to/test.dcm", "P001", "X-Ray")
    assert image_id == 0
    assert len(system.images) == 1
    print("✓ Add image test passed")


def test_get_image():
    """Test retrieving an image"""
    system = AdiologySystem()
    system.add_image("/path/to/test.dcm", "P001", "X-Ray")
    image = system.get_image(0)
    assert image is not None
    assert image['patient_id'] == "P001"
    assert image['type'] == "X-Ray"
    print("✓ Get image test passed")


def test_get_invalid_image():
    """Test retrieving an invalid image"""
    system = AdiologySystem()
    image = system.get_image(999)
    assert image is None
    print("✓ Get invalid image test passed")


def test_list_images():
    """Test listing all images"""
    system = AdiologySystem()
    system.add_image("/path/to/test1.dcm", "P001", "X-Ray")
    system.add_image("/path/to/test2.dcm", "P002", "CT Scan")
    images = system.list_images()
    assert len(images) == 2
    assert images[0]['patient_id'] == "P001"
    assert images[1]['patient_id'] == "P002"
    print("✓ List images test passed")


def test_analyze_image():
    """Test analyzing an image"""
    system = AdiologySystem()
    image_id = system.add_image("/path/to/test.dcm", "P001", "X-Ray")
    analysis = system.analyze_image(image_id)
    assert analysis is not None
    assert analysis['patient_id'] == "P001"
    assert analysis['status'] == "analyzed"
    print("✓ Analyze image test passed")


def test_analyze_invalid_image():
    """Test analyzing an invalid image"""
    system = AdiologySystem()
    analysis = system.analyze_image(999)
    assert analysis is None
    print("✓ Analyze invalid image test passed")


def test_get_info():
    """Test getting system information"""
    system = AdiologySystem()
    info = system.get_info()
    assert "Adiology" in info
    assert "1.0.0" in info
    assert "14-Jan-2026" in info
    print("✓ Get info test passed")


def run_tests():
    """Run all tests"""
    print("=" * 50)
    print("Running Adiology Tests")
    print("=" * 50)
    
    tests = [
        test_system_initialization,
        test_add_image,
        test_get_image,
        test_get_invalid_image,
        test_list_images,
        test_analyze_image,
        test_analyze_invalid_image,
        test_get_info
    ]
    
    passed = 0
    failed = 0
    
    for test in tests:
        try:
            test()
            passed += 1
        except AssertionError as e:
            print(f"✗ {test.__name__} failed: {e}")
            failed += 1
        except Exception as e:
            print(f"✗ {test.__name__} error: {e}")
            failed += 1
    
    print("\n" + "=" * 50)
    print(f"Results: {passed} passed, {failed} failed")
    print("=" * 50)
    
    return 0 if failed == 0 else 1


if __name__ == "__main__":
    sys.exit(run_tests())
