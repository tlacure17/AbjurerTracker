// HP Tracking State
let hpState = {
    arcane: {
        current: 0,
        max: 18,
        damageAbsorbed: 0
    },
    reservoir: {
        current: 0,
        max: null, // No maximum for reservoir
        damageAbsorbed: 0
    },
    main: {
        current: 0,
        max: 57
    }
};

// Party Members Tracking State
let partyMembers = {};

// Special Abilities State
let specialAbilities = {
    fortuneFromTheMany: {
        maxUses: 3,
        usedCount: 0
    },
    feyGift: {
        maxUses: 3,
        usedCount: 0
    },
    quickRitual: {
        maxUses: 1,
        usedCount: 0
    }
};

// Initialize the app
document.addEventListener('DOMContentLoaded', function() {
    loadState();
    updateAllDisplays();
    renderPartyMembers();
    updateFortuneDisplay();
    updateFeyGiftDisplay();
    updateQuickRitualDisplay();
});

// Save state to localStorage
function saveState() {
    const state = {
        hpState: hpState,
        partyMembers: partyMembers,
        specialAbilities: specialAbilities
    };
    localStorage.setItem('abjurerTracker', JSON.stringify(state));
}

// Load state from localStorage
function loadState() {
    const saved = localStorage.getItem('abjurerTracker');
    if (saved) {
        const parsed = JSON.parse(saved);
        
        // Handle both old format (just hpState) and new format (with partyMembers and specialAbilities)
        if (parsed.hpState) {
            hpState = { ...hpState, ...parsed.hpState };
            partyMembers = parsed.partyMembers || {};
            specialAbilities = { ...specialAbilities, ...parsed.specialAbilities };
        } else {
            // Legacy format - just hpState
            hpState = { ...hpState, ...parsed };
        }
    }
    
    // Initialize damage absorbed counters if they don't exist (backward compatibility)
    if (hpState.arcane.damageAbsorbed === undefined) {
        hpState.arcane.damageAbsorbed = 0;
    }
    if (hpState.reservoir.damageAbsorbed === undefined) {
        hpState.reservoir.damageAbsorbed = 0;
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
    
    // Update damage absorbed counter (for arcane and reservoir only)
    if (category === 'arcane' || category === 'reservoir') {
        const absorbedElement = document.getElementById(`${category}-absorbed`);
        if (absorbedElement && hpState[category].damageAbsorbed !== undefined) {
            absorbedElement.textContent = hpState[category].damageAbsorbed;
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

// Reset damage absorbed counter for a specific category
function resetDamageAbsorbed(category) {
    if (confirm(`Reset damage absorbed counter for ${getCategoryDisplayName(category)}?`)) {
        if (hpState[category].damageAbsorbed !== undefined) {
            hpState[category].damageAbsorbed = 0;
            updateDisplay(category);
        }
    }
}

// Reset all damage absorbed counters
function resetAllDamageAbsorbed() {
    if (confirm('Reset all damage absorbed counters?')) {
        hpState.arcane.damageAbsorbed = 0;
        hpState.reservoir.damageAbsorbed = 0;
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
        hpState.arcane.damageAbsorbed += arcaneAbsorbed; // Increment damage absorbed counter
        damage -= arcaneAbsorbed;
        damageLog.push(`Arcane Ward absorbed ${arcaneAbsorbed} damage`);
    }
    
    // Apply remaining damage to Shielding Reservoir
    if (damage > 0 && hpState.reservoir.current > 0) {
        const reservoirAbsorbed = Math.min(damage, hpState.reservoir.current);
        hpState.reservoir.current -= reservoirAbsorbed;
        hpState.reservoir.damageAbsorbed += reservoirAbsorbed; // Increment damage absorbed counter
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

// ==========================================
// SPELL RECHARGING FUNCTIONS
// ==========================================

// Recharge defenses from spell casting
function rechargeFromSpell(type) {
    const spellLevel = parseInt(document.getElementById('spell-level').value) || 1;
    const intModifier = parseInt(document.getElementById('int-modifier').value) || 4;
    
    let recharged = [];
    
    if (type === 'arcane' || type === 'both') {
        // Arcane Ward: Spell Level × 2
        const arcaneRecharge = spellLevel * 2;
        const oldArcane = hpState.arcane.current;
        hpState.arcane.current = Math.min(hpState.arcane.max, hpState.arcane.current + arcaneRecharge);
        const actualArcaneGain = hpState.arcane.current - oldArcane;
        
        if (actualArcaneGain > 0) {
            recharged.push(`Arcane Ward: +${actualArcaneGain} HP`);
            
            // Visual feedback
            const arcaneElement = document.querySelector('.arcane-ward');
            arcaneElement.classList.add('heal-animation');
            setTimeout(() => arcaneElement.classList.remove('heal-animation'), 500);
        }
    }
    
    if (type === 'reservoir' || type === 'both') {
        // Shielding Reservoir: Spell Level + INT Modifier (replaces current HP)
        const reservoirRecharge = spellLevel + intModifier;
        const oldReservoir = hpState.reservoir.current;
        hpState.reservoir.current = reservoirRecharge; // Replace instead of add
        
        recharged.push(`Shielding Reservoir: ${reservoirRecharge} HP (was ${oldReservoir})`);
        
        // Visual feedback
        const reservoirElement = document.querySelector('.shielding-reservoir');
        reservoirElement.classList.add('heal-animation');
        setTimeout(() => reservoirElement.classList.remove('heal-animation'), 500);
    }
    
    // Update displays
    updateAllDisplays();
    
    // Show recharge summary
    const spellTypeText = type === 'both' ? 'Abjuration' : (type === 'arcane' ? 'Any' : 'Any');
    let message = `Cast Level ${spellLevel} ${spellTypeText} Spell:\n\n${recharged.join('\n')}`;
    
    if (type === 'both') {
        message += `\n\n✨ Abjuration spells recharge both defenses!`;
    }
    
    alert(message);
}

// Get current spell recharge preview
function getRechargePreview() {
    const spellLevel = parseInt(document.getElementById('spell-level').value) || 1;
    const intModifier = parseInt(document.getElementById('int-modifier').value) || 4;
    
    return {
        arcane: spellLevel * 2,
        reservoir: spellLevel + intModifier
    };
}

// Update spell button text with current values (optional enhancement)
function updateSpellButtonText() {
    const preview = getRechargePreview();
    
    const arcaneBtn = document.querySelector('.btn-spell-arcane small');
    const reservoirBtn = document.querySelector('.btn-spell-reservoir small');
    const bothBtn = document.querySelector('.btn-spell-both small');
    
    if (arcaneBtn) arcaneBtn.textContent = `(+${preview.arcane} HP)`;
    if (reservoirBtn) reservoirBtn.textContent = `(Set to ${preview.reservoir} HP)`;
    if (bothBtn) bothBtn.textContent = `(+${preview.arcane} / Set ${preview.reservoir} HP)`;
}

// Add event listeners for spell inputs to update button text
document.addEventListener('DOMContentLoaded', function() {
    const spellLevelInput = document.getElementById('spell-level');
    const intModInput = document.getElementById('int-modifier');
    
    if (spellLevelInput && intModInput) {
        spellLevelInput.addEventListener('input', updateSpellButtonText);
        intModInput.addEventListener('input', updateSpellButtonText);
        
        // Initial update
        setTimeout(updateSpellButtonText, 100);
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

// Add Enter key support for new member input
document.getElementById('new-member-name').addEventListener('keypress', function(event) {
    if (event.key === 'Enter') {
        addPartyMember();
    }
});

// ==========================================
// PARTY MEMBER TRACKING FUNCTIONS
// ==========================================

// Add a new party member
function addPartyMember() {
    try {
        console.log('addPartyMember called');
        const nameInput = document.getElementById('new-member-name');
        
        if (!nameInput) {
            console.error('Could not find new-member-name input element');
            alert('Error: Could not find input field. Please refresh the page.');
            return;
        }
        
        const name = nameInput.value.trim();
        console.log('Member name:', name);
        
        if (!name) {
            alert('Please enter a party member name.');
            return;
        }
        
        if (partyMembers[name]) {
            alert('Party member with that name already exists.');
            return;
        }
        
        // Add new member with 0 damage prevented
        partyMembers[name] = {
            damagePrevented: 0
        };
        
        console.log('Added member:', name, 'Party members:', partyMembers);
        
        // Clear input and re-render
        nameInput.value = '';
        renderPartyMembers();
        saveState();
        
        console.log('Member added successfully');
    } catch (error) {
        console.error('Error in addPartyMember:', error);
        alert('Error adding party member: ' + error.message);
    }
}

// Remove a party member
function removePartyMember(memberName) {
    if (confirm(`Remove ${memberName} from party tracking?`)) {
        delete partyMembers[memberName];
        renderPartyMembers();
        saveState();
    }
}

// Add damage prevented for a member
function addDamagePrevented(memberName, amount) {
    if (partyMembers[memberName]) {
        partyMembers[memberName].damagePrevented += amount;
        renderPartyMembers();
        saveState();
        
        // Visual feedback
        const memberElement = document.querySelector(`[data-member="${memberName}"]`);
        if (memberElement) {
            memberElement.classList.add('heal-animation');
            setTimeout(() => memberElement.classList.remove('heal-animation'), 500);
        }
    }
}

// Subtract damage prevented for a member (in case of mistakes)
function subtractDamagePrevented(memberName, amount) {
    if (partyMembers[memberName]) {
        partyMembers[memberName].damagePrevented = Math.max(0, partyMembers[memberName].damagePrevented - amount);
        renderPartyMembers();
        saveState();
        
        // Visual feedback
        const memberElement = document.querySelector(`[data-member="${memberName}"]`);
        if (memberElement) {
            memberElement.classList.add('damage-animation');
            setTimeout(() => memberElement.classList.remove('damage-animation'), 500);
        }
    }
}

// Add/subtract damage prevented using input
function modifyDamagePreventedByInput(memberName, isAdd) {
    const inputElement = document.getElementById(`${memberName}-input`);
    const amount = parseInt(inputElement.value) || 1;
    
    if (isAdd) {
        addDamagePrevented(memberName, amount);
    } else {
        subtractDamagePrevented(memberName, amount);
    }
}

// Reset party member's damage prevented
function resetMemberDamage(memberName) {
    if (confirm(`Reset damage prevented for ${memberName}?`)) {
        if (partyMembers[memberName]) {
            partyMembers[memberName].damagePrevented = 0;
            renderPartyMembers();
            saveState();
        }
    }
}

// Reset all party tracking
function resetPartyTracking() {
    if (confirm('Reset all party damage tracking? This will set all damage prevented to 0.')) {
        Object.keys(partyMembers).forEach(memberName => {
            partyMembers[memberName].damagePrevented = 0;
        });
        renderPartyMembers();
        saveState();
    }
}

// Render all party members
function renderPartyMembers() {
    try {
        console.log('renderPartyMembers called');
        const container = document.getElementById('party-members');
        
        if (!container) {
            console.error('Could not find party-members container');
            return;
        }
        
        container.innerHTML = '';
        
        const memberNames = Object.keys(partyMembers).sort();
        console.log('Rendering members:', memberNames);
        
        if (memberNames.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: #666; font-style: italic; grid-column: 1 / -1;">No party members added yet. Add some above!</p>';
            return;
        }
    
    memberNames.forEach(memberName => {
        const member = partyMembers[memberName];
        const memberElement = document.createElement('div');
        memberElement.className = 'party-member';
        memberElement.setAttribute('data-member', memberName);
        
        memberElement.innerHTML = `
            <div class="party-member-header">
                <span class="party-member-name">${escapeHtml(memberName)}</span>
                <button class="remove-member" onclick="removePartyMember('${escapeHtml(memberName)}')" title="Remove ${escapeHtml(memberName)}">×</button>
            </div>
            <div class="damage-prevented">
                <span class="damage-prevented-amount">${member.damagePrevented}</span>
                <span class="damage-prevented-label">Damage Prevented</span>
            </div>
            <div class="member-controls">
                <input type="number" class="hp-input" id="${memberName}-input" value="1" min="1" inputmode="numeric">
                <button class="btn btn-add" onclick="modifyDamagePreventedByInput('${escapeHtml(memberName)}', true)">Add</button>
                <button class="btn btn-subtract" onclick="modifyDamagePreventedByInput('${escapeHtml(memberName)}', false)">Remove</button>
                <button class="btn btn-reset" onclick="resetMemberDamage('${escapeHtml(memberName)}')">Reset</button>
            </div>
        `;
        
        container.appendChild(memberElement);
        
            // Add Enter key support for this member's input
            const memberInput = document.getElementById(`${memberName}-input`);
            if (memberInput) {
                memberInput.addEventListener('keypress', function(event) {
                    if (event.key === 'Enter') {
                        modifyDamagePreventedByInput(memberName, true);
                    }
                });
            }
        });
    } catch (error) {
        console.error('Error in renderPartyMembers:', error);
    }
}

// Utility function to escape HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ==========================================
// SPECIAL ABILITIES FUNCTIONS
// ==========================================

// Update Fortune From the Many usage tracking
function updateFortuneUsage() {
    let usedCount = 0;
    
    // Count checked checkboxes
    for (let i = 1; i <= specialAbilities.fortuneFromTheMany.maxUses; i++) {
        const checkbox = document.getElementById(`fortune-use-${i}`);
        if (checkbox && checkbox.checked) {
            usedCount++;
        }
    }
    
    specialAbilities.fortuneFromTheMany.usedCount = usedCount;
    updateFortuneDisplay();
    saveState();
}

// Update Fortune From the Many display
function updateFortuneDisplay() {
    const remaining = specialAbilities.fortuneFromTheMany.maxUses - specialAbilities.fortuneFromTheMany.usedCount;
    const remainingElement = document.getElementById('fortune-remaining');
    
    if (remainingElement) {
        remainingElement.textContent = remaining;
        remainingElement.style.color = remaining > 0 ? '#2e7d32' : '#d32f2f';
    }
    
    // Update checkboxes to match saved state
    for (let i = 1; i <= specialAbilities.fortuneFromTheMany.maxUses; i++) {
        const checkbox = document.getElementById(`fortune-use-${i}`);
        if (checkbox) {
            checkbox.checked = i <= specialAbilities.fortuneFromTheMany.usedCount;
        }
    }
}

// Reset Fortune From the Many uses (Long Rest)
function resetFortuneUses() {
    if (confirm('Reset Fortune From the Many uses? (Long Rest)')) {
        specialAbilities.fortuneFromTheMany.usedCount = 0;
        
        // Uncheck all checkboxes
        for (let i = 1; i <= specialAbilities.fortuneFromTheMany.maxUses; i++) {
            const checkbox = document.getElementById(`fortune-use-${i}`);
            if (checkbox) {
                checkbox.checked = false;
            }
        }
        
        updateFortuneDisplay();
        saveState();
        
        // Visual feedback
        const abilityCard = document.querySelector('.ability-card');
        if (abilityCard) {
            abilityCard.classList.add('heal-animation');
            setTimeout(() => abilityCard.classList.remove('heal-animation'), 500);
        }
    }
}

// Update Fey Gift usage tracking
function updateFeyGiftUsage() {
    let usedCount = 0;
    
    // Count checked checkboxes
    for (let i = 1; i <= specialAbilities.feyGift.maxUses; i++) {
        const checkbox = document.getElementById(`fey-gift-use-${i}`);
        if (checkbox && checkbox.checked) {
            usedCount++;
        }
    }
    
    specialAbilities.feyGift.usedCount = usedCount;
    updateFeyGiftDisplay();
    saveState();
}

// Update Fey Gift display
function updateFeyGiftDisplay() {
    const remaining = specialAbilities.feyGift.maxUses - specialAbilities.feyGift.usedCount;
    const remainingElement = document.getElementById('fey-gift-remaining');
    
    if (remainingElement) {
        remainingElement.textContent = remaining;
        remainingElement.style.color = remaining > 0 ? '#2e7d32' : '#d32f2f';
    }
    
    // Update checkboxes to match saved state
    for (let i = 1; i <= specialAbilities.feyGift.maxUses; i++) {
        const checkbox = document.getElementById(`fey-gift-use-${i}`);
        if (checkbox) {
            checkbox.checked = i <= specialAbilities.feyGift.usedCount;
        }
    }
}

// Reset Fey Gift uses (Long Rest)
function resetFeyGiftUses() {
    if (confirm('Reset Fey Gift uses? (Long Rest)')) {
        specialAbilities.feyGift.usedCount = 0;
        
        // Uncheck all checkboxes
        for (let i = 1; i <= specialAbilities.feyGift.maxUses; i++) {
            const checkbox = document.getElementById(`fey-gift-use-${i}`);
            if (checkbox) {
                checkbox.checked = false;
            }
        }
        
        updateFeyGiftDisplay();
        saveState();
        
        // Visual feedback
        const abilityCards = document.querySelectorAll('.ability-card');
        abilityCards.forEach(card => {
            if (card.textContent.includes('Fey Gift')) {
                card.classList.add('heal-animation');
                setTimeout(() => card.classList.remove('heal-animation'), 500);
            }
        });
    }
}

// Update Quick Ritual usage tracking
function updateQuickRitualUsage() {
    let usedCount = 0;
    
    // Count checked checkboxes
    for (let i = 1; i <= specialAbilities.quickRitual.maxUses; i++) {
        const checkbox = document.getElementById(`quick-ritual-use-${i}`);
        if (checkbox && checkbox.checked) {
            usedCount++;
        }
    }
    
    specialAbilities.quickRitual.usedCount = usedCount;
    updateQuickRitualDisplay();
    saveState();
}

// Update Quick Ritual display
function updateQuickRitualDisplay() {
    const remaining = specialAbilities.quickRitual.maxUses - specialAbilities.quickRitual.usedCount;
    const remainingElement = document.getElementById('quick-ritual-remaining');
    
    if (remainingElement) {
        remainingElement.textContent = remaining;
        remainingElement.style.color = remaining > 0 ? '#2e7d32' : '#d32f2f';
    }
    
    // Update checkboxes to match saved state
    for (let i = 1; i <= specialAbilities.quickRitual.maxUses; i++) {
        const checkbox = document.getElementById(`quick-ritual-use-${i}`);
        if (checkbox) {
            checkbox.checked = i <= specialAbilities.quickRitual.usedCount;
        }
    }
}

// Reset Quick Ritual uses (Short Rest)
function resetQuickRitualUses() {
    if (confirm('Reset Quick Ritual uses? (Short Rest)')) {
        specialAbilities.quickRitual.usedCount = 0;
        
        // Uncheck all checkboxes
        for (let i = 1; i <= specialAbilities.quickRitual.maxUses; i++) {
            const checkbox = document.getElementById(`quick-ritual-use-${i}`);
            if (checkbox) {
                checkbox.checked = false;
            }
        }
        
        updateQuickRitualDisplay();
        saveState();
        
        // Visual feedback
        const abilityCards = document.querySelectorAll('.ability-card');
        abilityCards.forEach(card => {
            if (card.textContent.includes('Quick Ritual')) {
                card.classList.add('heal-animation');
                setTimeout(() => card.classList.remove('heal-animation'), 500);
            }
        });
    }
}
