# 🛡️ Abjurer Tracker

A simple web application for tracking D&D HP categories specifically designed for Abjuration Wizards and characters with layered defensive abilities.

## Features

### HP Categories
- **⚡ Arcane Ward**: Fixed maximum of 18 HP (as per D&D 5e rules)
- **🔮 Shielding Reservoir**: Customizable maximum HP
- **❤️ Main HP**: Customizable maximum HP

### Damage System
The app automatically applies damage in the correct order:
1. **Arcane Ward** absorbs damage first
2. **Shielding Reservoir** absorbs remaining damage
3. **Main HP** takes any remaining damage

### Controls
- **Individual Category Controls**: Add/subtract HP in increments of 1 or 5
- **Damage Application**: Enter any amount of damage to apply automatically
- **Reset Options**: Reset individual categories or all at once
- **Persistent Storage**: Your HP values are saved automatically

### Keyboard Shortcuts
- **Spacebar**: Apply damage
- **R**: Reset all HP
- **1**: Add 1 HP to Arcane Ward
- **2**: Add 1 HP to Shielding Reservoir  
- **3**: Add 1 HP to Main HP
- **Enter**: Submit damage or max HP changes

## Usage

1. **Setup**: 
   - Set your maximum HP for Shielding Reservoir and Main HP
   - Arcane Ward is automatically set to 18 HP maximum

2. **Managing HP**:
   - Use the +/- buttons to manually adjust HP in each category
   - Use the "Take Damage" section to apply damage automatically
   - Reset individual categories or all categories as needed

3. **Taking Damage**:
   - Enter the damage amount
   - Click "Apply Damage" or press Enter
   - The system will show you exactly how the damage was distributed

## Technical Details

- **Pure HTML/CSS/JavaScript**: No frameworks required
- **Responsive Design**: Works on desktop and mobile devices
- **Local Storage**: Automatically saves your HP state
- **Visual Feedback**: Animations show healing and damage
- **Accessibility**: Clear visual indicators and keyboard support

## Files

- `index.html`: Main application structure
- `styles.css`: Styling and responsive design
- `script.js`: HP tracking logic and damage calculation
- `README.md`: This documentation

## Getting Started

1. Open `index.html` in any modern web browser
2. Set your maximum HP values for Shielding Reservoir and Main HP
3. Start tracking your HP!

## D&D 5e Abjuration Wizard Features

This tracker is specifically designed to work with:
- **Arcane Ward** (Level 2 Abjuration Wizard feature)
- Various **temporary HP** sources (tracked as "Shielding Reservoir")
- Your character's **actual HP**

The damage order follows D&D 5e rules where temporary HP and wards are depleted before actual HP.

---

*Perfect for Abjuration Wizards, Artillerist Artificers, and any character with layered defensive abilities!*
