/**
 * Copy text to clipboard with fallback methods
 * Handles Clipboard API restrictions by using older methods as fallback
 */
export const copyToClipboard = async (text: string): Promise<boolean> => {
    // Method 1: Try modern Clipboard API first
    if (navigator.clipboard && navigator.clipboard.writeText) {
        try {
            await navigator.clipboard.writeText(text);
            return true;
        } catch (err) {
            console.log('Clipboard API blocked, trying fallback method...');
        }
    }

    // Method 2: Fallback to document.execCommand (deprecated but more compatible)
    try {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        const successful = document.execCommand('copy');
        document.body.removeChild(textArea);
        
        if (successful) {
            return true;
        }
    } catch (err) {
        console.error('Fallback copy method failed:', err);
    }

    // Method 3: Final fallback - create a visible textarea for manual copy
    try {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.top = '50%';
        textArea.style.left = '50%';
        textArea.style.transform = 'translate(-50%, -50%)';
        textArea.style.padding = '20px';
        textArea.style.background = 'white';
        textArea.style.border = '2px solid #4F46E5';
        textArea.style.borderRadius = '8px';
        textArea.style.zIndex = '10000';
        textArea.style.width = '80%';
        textArea.style.maxWidth = '600px';
        textArea.style.height = '200px';
        
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (document.body.contains(textArea)) {
                document.body.removeChild(textArea);
            }
        }, 5000);
        
        return true;
    } catch (err) {
        console.error('All copy methods failed:', err);
        return false;
    }
};
