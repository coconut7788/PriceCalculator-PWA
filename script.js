const ITEMS_CONTAINER_ID = 'itemsContainer';
const UNIT_PRICE_CLASS = 'unit-price-value';
const ITEM_ROW_CLASS = 'item-row';
const BEST_PRICE_CLASS = 'best-price';
const ERROR_MSG_CLASS = 'error-message';

function safeEvaluate(expr) {
    const cleaned = expr.replace(/[^0-9+\-*/.%()\s]/g, '');
    if (!cleaned.trim()) return NaN;
    try {
        const result = Function('"use strict"; return (' + cleaned + ')')();
        return typeof result === 'number' && isFinite(result) ? result : NaN;
    } catch {
        return NaN;
    }
}

function parseInput(value) {
    const trimmed = value.trim();
    if (!trimmed) return NaN;
    return safeEvaluate(trimmed);
}

function calculateUnitPrice(row) {
    const quantityInput = row.querySelector('input[id^="quantity-"]');
    const priceInput = row.querySelector('input[id^="price-"]');
    const unitPriceSpan = row.querySelector('.' + UNIT_PRICE_CLASS);

    if (!quantityInput || !priceInput || !unitPriceSpan) return;

    const quantity = parseInput(quantityInput.value);
    const price = parseInput(priceInput.value);

    if ((quantityInput.value.trim() === '' || priceInput.value.trim() === '') &&
        !(quantityInput.value.trim() === '' && priceInput.value.trim() === '')) {
        unitPriceSpan.textContent = '=0.000';
        return false;
    }

    if (isNaN(quantity) || isNaN(price) || quantity === 0) {
        unitPriceSpan.textContent = '=无效';
        return false;
    }

    const unitPrice = price / quantity;

    let decimals;
    if (unitPrice < 1000) {
        decimals = 3;
    } else if (unitPrice < 10000) {
        decimals = 2;
    } else {
        decimals = 1;
    }
    unitPriceSpan.textContent = '=' + unitPrice.toFixed(decimals);

    return unitPrice;
}

function findAllItemRows() {
    const container = document.getElementById(ITEMS_CONTAINER_ID);
    return container ? Array.from(container.querySelectorAll('.' + ITEM_ROW_CLASS)) : [];
}

function findBestPriceRow(rows) {
    let bestRow = null;
    let bestPrice = Infinity;

    rows.forEach(row => {
        const quantityInput = row.querySelector('input[id^="quantity-"]');
        const priceInput = row.querySelector('input[id^="price-"]');

        if (!quantityInput || !priceInput) return;

        const quantity = parseInput(quantityInput.value);
        const price = parseInput(priceInput.value);

        if (isNaN(quantity) || isNaN(price) || quantity === 0) return;

        const unitPrice = price / quantity;
        if (unitPrice <= bestPrice) {
            bestPrice = unitPrice;
            bestRow = row;
        }
    });

    return bestRow;
}

function updateBestPriceHighlight() {
    const rows = findAllItemRows();
    rows.forEach(row => row.classList.remove(BEST_PRICE_CLASS));

    const validRows = rows.filter(row => {
        const quantityInput = row.querySelector('input[id^="quantity-"]');
        const priceInput = row.querySelector('input[id^="price-"]');
        if (!quantityInput || !priceInput) return false;
        const quantity = parseInput(quantityInput.value);
        const price = parseInput(priceInput.value);
        return !isNaN(quantity) && !isNaN(price) && quantity !== 0;
    });

    if (validRows.length > 1) {
        const bestRow = findBestPriceRow(validRows);
        if (bestRow) {
            bestRow.classList.add(BEST_PRICE_CLASS);
        }
    }
}

function showError(input, message) {
    hideError(input);
    const errorEl = document.createElement('div');
    errorEl.className = ERROR_MSG_CLASS;
    errorEl.textContent = message;
    errorEl.style.cssText = 'position: absolute; bottom: -1.8rem; left: 50%; transform: translateX(-50%); font-size: 0.75rem; color: #D35400; background: #FDEBD0; padding: 0.2rem 0.5rem; border-radius: 0.3rem; white-space: nowrap; z-index: 10;';
    input.parentElement.style.position = 'relative';
    input.parentElement.appendChild(errorEl);
    setTimeout(() => hideError(input), 2500);
}

function hideError(input) {
    const existing = input.parentElement.querySelector('.' + ERROR_MSG_CLASS);
    if (existing) existing.remove();
}

function handleInputChange(e) {
    const target = e.target;
    if (!target.id || !target.id.match(/^(quantity-|price-|remark-)\d+$/)) return;

    hideError(target);

    const row = target.closest('.' + ITEM_ROW_CLASS);
    if (!row) return;

    if (target.id.startsWith('quantity-') || target.id.startsWith('price-')) {
        const quantityInput = row.querySelector('input[id^="quantity-"]');
        const priceInput = row.querySelector('input[id^="price-"]');

        if (/[^0-9+\-*/.%()\s]/.test(quantityInput.value)) {
            showError(quantityInput, '请输入有效的数量表达式');
            return;
        }

        if (/[^0-9+\-*/.%\s]/.test(priceInput.value)) {
            showError(priceInput, '请输入有效数字');
            return;
        }

        calculateUnitPrice(row);
        updateBestPriceHighlight();
    }
}

function getAllInputsInOrder() {
    const rows = findAllItemRows();
    const inputs = [];
    rows.forEach(row => {
        const remarkInput = row.querySelector('input[id^="remark-"]');
        const quantityInput = row.querySelector('input[id^="quantity-"]');
        const priceInput = row.querySelector('input[id^="price-"]');
        if (remarkInput) inputs.push(remarkInput);
        if (quantityInput) inputs.push(quantityInput);
        if (priceInput) inputs.push(priceInput);
    });
    return inputs;
}

function handleKeyDown(e) {
    const target = e.target;
    if (!target.id || !target.id.match(/^(quantity-|price-|remark-)\d+$/)) return;

    if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        const inputs = getAllInputsInOrder();
        const currentIndex = inputs.indexOf(target);

        if (currentIndex === -1) return;

        let nextIndex = currentIndex + 1;
        if (nextIndex >= inputs.length) {
            const addBtn = document.getElementById('addRowBtn');
            if (addBtn) addBtn.click();
            setTimeout(() => {
                const newInputs = getAllInputsInOrder();
                if (newInputs.length > inputs.length) {
                    newInputs[inputs.length].focus();
                }
            }, 50);
        } else {
            inputs[nextIndex].focus();
            inputs[nextIndex].select();
        }
    }
}

function addNewRow() {
    const container = document.getElementById(ITEMS_CONTAINER_ID);
    if (!container) return;

    const existingRows = container.querySelectorAll('.' + ITEM_ROW_CLASS);
    const newId = existingRows.length > 0
        ? Math.max(...Array.from(existingRows).map(r => parseInt(r.dataset.id || '0', 10))) + 1
        : 1;

    const newRow = document.createElement('div');
    newRow.className = ITEM_ROW_CLASS;
    newRow.dataset.id = newId;
    newRow.innerHTML = `
        <div class="col-remark">
            <input type="text" id="remark-${newId}" placeholder="" inputmode="text">
        </div>
        <div class="col-quantity">
            <input type="text" id="quantity-${newId}" placeholder="" inputmode="decimal">
        </div>
        <div class="col-price">
            <input type="text" id="price-${newId}" placeholder="" inputmode="decimal">
        </div>
        <div class="col-unit">
            <span class="unit-price-value">=0.000</span>
        </div>
        <div class="col-delete">
            <button class="delete-btn" type="button" aria-label="删除此行">✕</button>
        </div>
    `;

    container.appendChild(newRow);
    attachRowEvents(newRow);

    const firstInput = newRow.querySelector('input[id^="remark-"]');
    if (firstInput) {
        firstInput.focus();
    }
}

function deleteRow(row) {
    const container = document.getElementById(ITEMS_CONTAINER_ID);
    if (!container) return;

    const rows = container.querySelectorAll('.' + ITEM_ROW_CLASS);
    if (rows.length <= 1) {
        const firstRow = rows[0];
        if (firstRow) {
            const inputs = firstRow.querySelectorAll('input');
            inputs.forEach(input => {
                input.value = '';
                hideError(input);
            });
            const unitPriceSpan = firstRow.querySelector('.' + UNIT_PRICE_CLASS);
            if (unitPriceSpan) unitPriceSpan.textContent = '=0.000';
            firstRow.classList.remove(BEST_PRICE_CLASS);
        }
        return;
    }

    row.remove();
    updateBestPriceHighlight();
}

function clearAllRows() {
    const container = document.getElementById(ITEMS_CONTAINER_ID);
    if (!container) return;

    container.innerHTML = `
        <div class="item-row" data-id="1">
            <div class="col-remark">
                <input type="text" id="remark-1" placeholder="" inputmode="text">
            </div>
            <div class="col-quantity">
                <input type="text" id="quantity-1" placeholder="" inputmode="decimal">
            </div>
            <div class="col-price">
                <input type="text" id="price-1" placeholder="" inputmode="decimal">
            </div>
            <div class="col-unit">
                <span class="unit-price-value">=0.000</span>
            </div>
            <div class="col-delete">
                <button class="delete-btn" type="button" aria-label="删除此行">✕</button>
            </div>
        </div>
        <div class="item-row" data-id="2">
            <div class="col-remark">
                <input type="text" id="remark-2" placeholder="" inputmode="text">
            </div>
            <div class="col-quantity">
                <input type="text" id="quantity-2" placeholder="" inputmode="decimal">
            </div>
            <div class="col-price">
                <input type="text" id="price-2" placeholder="" inputmode="decimal">
            </div>
            <div class="col-unit">
                <span class="unit-price-value">=0.000</span>
            </div>
            <div class="col-delete">
                <button class="delete-btn" type="button" aria-label="删除此行">✕</button>
            </div>
        </div>
        <div class="item-row" data-id="3">
            <div class="col-remark">
                <input type="text" id="remark-3" placeholder="" inputmode="text">
            </div>
            <div class="col-quantity">
                <input type="text" id="quantity-3" placeholder="" inputmode="decimal">
            </div>
            <div class="col-price">
                <input type="text" id="price-3" placeholder="" inputmode="decimal">
            </div>
            <div class="col-unit">
                <span class="unit-price-value">=0.000</span>
            </div>
            <div class="col-delete">
                <button class="delete-btn" type="button" aria-label="删除此行">✕</button>
            </div>
        </div>
    `;

    const rows = container.querySelectorAll('.' + ITEM_ROW_CLASS);
    rows.forEach(row => attachRowEvents(row));

    const firstInput = container.querySelector('input[id^="remark-"]');
    if (firstInput) firstInput.focus();
}

function attachRowEvents(row) {
    const inputs = row.querySelectorAll('input');
    inputs.forEach(input => {
        input.addEventListener('input', handleInputChange);
        input.addEventListener('keydown', handleKeyDown);
    });

    const deleteBtn = row.querySelector('.delete-btn');
    if (deleteBtn) {
        deleteBtn.addEventListener('click', () => deleteRow(row));
    }
}

function init() {
    const container = document.getElementById(ITEMS_CONTAINER_ID);
    if (!container) return;

    const rows = container.querySelectorAll('.' + ITEM_ROW_CLASS);
    rows.forEach(row => attachRowEvents(row));

    const addBtn = document.getElementById('addRowBtn');
    if (addBtn) addBtn.addEventListener('click', addNewRow);

    const clearBtn = document.getElementById('clearAllBtn');
    if (clearBtn) clearBtn.addEventListener('click', clearAllRows);

    updateBestPriceHighlight();
}

if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js').then((registration) => {
        setInterval(() => {
            registration.update();
        }, 60 * 60 * 1000);
        registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
                newWorker.addEventListener('statechange', () => {
                    if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                        if (confirm('有新版本可用，是否立即更新？')) {
                            newWorker.postMessage({ type: 'SKIP_WAITING' });
                            window.location.reload();
                        }
                    }
                });
            }
        });
    }).catch((err) => {
        console.log('Service Worker 注册失败:', err);
    });
}

document.addEventListener('DOMContentLoaded', init);