// HP Tracking State
let hpState = {
    arcane: {
        current: 0,
        max: 18
    },
    reservoir: {
        current: 0,
        max: null // No maximum for reservoir
    },
    main: {
        current: 0,
        max: 57
    }
};

// Initialize the app
document.addEventListener('DOMContentLoaded', function() {
    loadState();
    updateAllDisplays();
});

// Save state to localStorage
function saveState() {
    localStorage.setItem('abjurerTracker', JSON.stringify(hpState));
}

// Load state from localStorage
function loadState() {
    const saved = localStorage.getItem('abjurerTracker');
    if (saved) {
        const parsed = JSON.parse(saved);
        hpState = { ...hpState, ...parsed };
    }
    
    // Always update the max HP inputs to match current state
    document.getElementById('arcane-max-input').value = hpState.arcane.max;
    document.getElementById('main-max-input').value = hpState.main.max;
}

// Update all HP displays and bars
function updateAllDisplays() {
    updateDisplay('arcane');
    updateDisplay('reservoir');
    updateDisplay('main');
}

// Update a specific HP category display
function updateDisplay(category) {
    const current = hpState[category].current;
    const max = hpState[category].max;
    
    // Update current HP display
    document.getElementById(`${category}-current`).textContent = current;
    
    // Update max HP display
    const maxElement = document.getElementById(`${category}-max`);
    if (maxElement) {
        maxElement.textContent = max;
    }
    
    // Update HP bar (skip for reservoir which has no max)
    if (category !== 'reservoir') {
        const percentage = max > 0 ? (current / max) * 100 : 0;
        const fillElement = document.getElementById(`${category}-fill`);
        if (fillElement) {
            fillElement.style.width = `${percentage}%`;
        }
    }
    
    // Save state
    saveState();
}

// Modify HP for a specific category
function modifyHP(category, amount) {
    const oldValue = hpState[category].current;
    let newValue = oldValue + amount;
    
    // Clamp between 0 and max (reservoir has no max)
    if (category === 'reservoir') {
        newValue = Math.max(0, newValue);
    } else {
        newValue = Math.max(0, Math.min(newValue, hpState[category].max));
    }
    
    hpState[category].current = newValue;
    updateDisplay(category);
    
    // Add visual feedback
    const categoryElement = document.querySelector(`.${category.replace('main', 'main-hp').replace('reservoir', 'shielding-reservoir').replace('arcane', 'arcane-ward')}`);
    if (amount > 0) {
        categoryElement.classList.add('heal-animation');
        setTimeout(() => categoryElement.classList.remove('heal-animation'), 500);
    } else if (amount < 0) {
        categoryElement.classList.add('damage-animation');
        setTimeout(() => categoryElement.classList.remove('damage-animation'), 500);
    }
}

// Modify HP using input value
function modifyHPByInput(category, isAdd) {
    const inputElement = document.getElementById(`${category}-input`);
    const amount = parseInt(inputElement.value) || 1;
    const finalAmount = isAdd ? amount : -amount;
    
    modifyHP(category, finalAmount);
}

// Update maximum HP for a category
function updateMaxHP(category, maxValue) {
    const max = Math.max(0, parseInt(maxValue) || 0);
    hpState[category].max = max;
    
    // Ensure current HP doesn't exceed new max
    if (hpState[category].current > max) {
        hpState[category].current = max;
    }
    
    updateDisplay(category);
}

// Reset a specific category
function resetCategory(category) {
    if (category === 'reservoir') {
        if (confirm(`Reset ${getCategoryDisplayName(category)} to 0?`)) {
            hpState[category].current = 0;
            updateDisplay(category);
        }
    } else {
        if (confirm(`Reset ${getCategoryDisplayName(category)} to full HP?`)) {
            hpState[category].current = hpState[category].max;
            updateDisplay(category);
        }
    }
}

// Reset all categories
function resetAll() {
    if (confirm('Reset all HP categories?')) {
        hpState.arcane.current = hpState.arcane.max;
        hpState.reservoir.current = 0; // Reset reservoir to 0
        hpState.main.current = hpState.main.max;
        updateAllDisplays();
    }
}

// Take damage (applies in order: Arcane Ward -> Shielding Reservoir -> Main HP)
function takeDamage() {
    const damageInput = document.getElementById('damage-amount');
    let damage = parseInt(damageInput.value) || 0;
    
    if (damage <= 0) {
        alert('Please enter a valid damage amount.');
        return;
    }
    
    const originalDamage = damage;
    let damageLog = [];
    
    // Apply damage to Arcane Ward first
    if (damage > 0 && hpState.arcane.current > 0) {
        const arcaneAbsorbed = Math.min(damage, hpState.arcane.current);
        hpState.arcane.current -= arcaneAbsorbed;
        damage -= arcaneAbsorbed;
        damageLog.push(`Arcane Ward absorbed ${arcaneAbsorbed} damage`);
    }
    
    // Apply remaining damage to Shielding Reservoir
    if (damage > 0 && hpState.reservoir.current > 0) {
        const reservoirAbsorbed = Math.min(damage, hpState.reservoir.current);
        hpState.reservoir.current -= reservoirAbsorbed;
        damage -= reservoirAbsorbed;
        damageLog.push(`Shielding Reservoir absorbed ${reservoirAbsorbed} damage`);
    }
    
    // Apply remaining damage to Main HP
    if (damage > 0 && hpState.main.current > 0) {
        const mainDamage = Math.min(damage, hpState.main.current);
        hpState.main.current -= mainDamage;
        damage -= mainDamage;
        damageLog.push(`Main HP took ${mainDamage} damage`);
    }
    
    // Update all displays
    updateAllDisplays();
    
    // Show damage log
    let logMessage = `Applied ${originalDamage} damage:\n\n${damageLog.join('\n')}`;
    if (damage > 0) {
        logMessage += `\n\n⚠️ Excess damage: ${damage} (no HP remaining to absorb)`;
    }
    
    alert(logMessage);
    
    // Add visual feedback to all affected categories
    setTimeout(() => {
        if (hpState.arcane.current < hpState.arcane.max) {
            document.querySelector('.arcane-ward').classList.add('damage-animation');
        }
        if (hpState.reservoir.current < hpState.reservoir.max) {
            document.querySelector('.shielding-reservoir').classList.add('damage-animation');
        }
        if (hpState.main.current < hpState.main.max) {
            document.querySelector('.main-hp').classList.add('damage-animation');
        }
        
        setTimeout(() => {
            document.querySelectorAll('.hp-category').forEach(el => {
                el.classList.remove('damage-animation');
            });
        }, 500);
    }, 100);
    
    // Clear the damage input
    damageInput.value = '1';
}

// Get display name for category
function getCategoryDisplayName(category) {
    const names = {
        'arcane': 'Arcane Ward',
        'reservoir': 'Shielding Reservoir',
        'main': 'Main HP'
    };
    return names[category] || category;
}

// Keyboard shortcuts
document.addEventListener('keydown', function(event) {
    // Only trigger if not focused on an input
    if (event.target.tagName === 'INPUT') return;
    
    switch(event.key) {
        case ' ':
            event.preventDefault();
            takeDamage();
            break;
        case 'r':
        case 'R':
            event.preventDefault();
            resetAll();
            break;
        case '1':
            event.preventDefault();
            modifyHP('arcane', 1);
            break;
        case '2':
            event.preventDefault();
            modifyHP('reservoir', 1);
            break;
        case '3':
            event.preventDefault();
            modifyHP('main', 1);
            break;
    }
});

// Add Enter key support for damage input
document.getElementById('damage-amount').addEventListener('keypress', function(event) {
    if (event.key === 'Enter') {
        takeDamage();
    }
});

// Add Enter key support for max HP inputs
document.getElementById('arcane-max-input').addEventListener('keypress', function(event) {
    if (event.key === 'Enter') {
        updateMaxHP('arcane', this.value);
    }
});

document.getElementById('main-max-input').addEventListener('keypress', function(event) {
    if (event.key === 'Enter') {
        updateMaxHP('main', this.value);
    }
});

// Add Enter key support for HP input fields
document.getElementById('arcane-input').addEventListener('keypress', function(event) {
    if (event.key === 'Enter') {
        modifyHPByInput('arcane', true);
    }
});

document.getElementById('reservoir-input').addEventListener('keypress', function(event) {
    if (event.key === 'Enter') {
        modifyHPByInput('reservoir', true);
    }
});

document.getElementById('main-input').addEventListener('keypress', function(event) {
    if (event.key === 'Enter') {
        modifyHPByInput('main', true);
    }
});
