# Audio Playback Troubleshooting Guide

## Common Issues in Production Deployment

### 1. Audio Not Playing (NotSupportedError)
**Symptoms:** Music generates successfully but won't play, console shows `NotSupportedError`

**Causes:**
- Browser doesn't support the audio format (WAV)
- CORS issues with audio file serving
- Blob URL creation problems

**Solutions:**
- Use the download button to save and play the file locally
- Try a different browser (Chrome, Firefox, Safari)
- Check browser console for specific error messages

### 2. Autoplay Blocked (NotAllowedError)
**Symptoms:** Audio requires multiple clicks to start playing

**Causes:**
- Browser autoplay policies require user interaction
- Page hasn't received user gesture before audio playback

**Solutions:**
- Click the play button after generation completes
- Interact with the page before generating music
- This is normal browser behavior for security

### 3. Network/CORS Issues
**Symptoms:** Audio generation completes but files won't load

**Causes:**
- Netlify function CORS configuration
- Network connectivity issues
- File serving problems

**Solutions:**
- Check network tab in browser dev tools
- Verify Netlify functions are deployed correctly
- Try refreshing the page and regenerating

## Debugging Steps

1. **Check Browser Console:**
   - Open Developer Tools (F12)
   - Look for audio-related errors
   - Note specific error types (NotAllowedError, NotSupportedError, etc.)

2. **Verify Audio Generation:**
   - Confirm "Music Generated!" toast appears
   - Check that download button is enabled
   - Try downloading the file directly

3. **Test Audio Playback:**
   - Click play button multiple times if needed
   - Try different browsers
   - Test on different devices

4. **Network Debugging:**
   - Check Network tab for failed requests
   - Verify audio file URLs are accessible
   - Look for CORS errors

## Browser Compatibility

- **Chrome:** Full support, best performance
- **Firefox:** Full support
- **Safari:** May have stricter autoplay policies
- **Edge:** Full support
- **Mobile browsers:** May have additional restrictions

## Workarounds

1. **Download and Play Locally:**
   - Always works regardless of browser restrictions
   - Click the download button after generation
   - Play the downloaded WAV file in your preferred audio player

2. **User Interaction:**
   - Ensure you interact with the page before generating
   - Click play immediately after generation completes
   - Some browsers require fresh user gestures

3. **Browser Settings:**
   - Allow autoplay for the site in browser settings
   - Disable strict security policies if needed
   - Clear browser cache if experiencing issues

## Technical Details

- Audio files are generated as WAV format (48kHz, 16-bit)
- Files are served via Netlify Functions with proper CORS headers
- Blob URLs are created for in-browser playback
- Download functionality bypasses browser playback restrictions

## Getting Help

If you continue experiencing issues:
1. Note your browser type and version
2. Copy any console error messages
3. Describe the specific behavior you're seeing
4. Try the download workaround as a temporary solution