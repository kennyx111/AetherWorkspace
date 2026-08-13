document.addEventListener('DOMContentLoaded', () => {
    // DOM Cache
    const canvas = document.getElementById('canvas-container');
    const svgLayer = document.getElementById('connection-layer');
    const freehandCanvas = document.getElementById('freehand-canvas');
    const ctx = freehandCanvas.getContext('2d');

    const railSidebar = document.getElementById('rail-sidebar');
    const inboxSidebar = document.getElementById('inbox-sidebar');
    const toggleRailBtn = document.getElementById('toggle-rail-btn');
    const toggleInboxBtn = document.getElementById('toggle-inbox-btn');
    const uncollapseInboxBtn = document.getElementById('uncollapse-inbox-btn');
    const uncollapseRailBtn = document.getElementById('uncollapse-rail-btn');

    const inboxTaskList = document.getElementById('inbox-task-list');
    const inboxCountBadge = document.getElementById('inbox-count-badge');

    const railSettingsBtn = document.getElementById('rail-settings-btn');
    const settingsDropdownMenu = document.getElementById('settings-dropdown-menu');

    const selectToolBtn = document.getElementById('select-tool-btn');
    const pencilToolBtn = document.getElementById('pencil-tool-btn');
    const eraserToolBtn = document.getElementById('eraser-tool-btn');
    const textToolBtn = document.getElementById('text-tool-btn');
    const globalFontSelector = document.getElementById('global-font-selector');
    const shapeToolBtn = document.getElementById('shape-tool-btn');
    const shapesPopupMenu = document.getElementById('shapes-popup-menu');
    const shapeColorPicker = document.getElementById('shape-color-picker');
    const openAddTaskBtn = document.getElementById('open-add-task-btn');
    const quickAddCardBtn = document.getElementById('quick-add-card-btn');
    const deleteSelectedBtn = document.getElementById('delete-selected-btn');

    const arrowContextMenu = document.getElementById('arrow-color-context');
    const arrowCustomColor = document.getElementById('arrow-custom-color');

    const modalBackdrop = document.getElementById('task-modal-backdrop');
    const closeModalBtn = document.getElementById('close-modal-btn');
    const cancelModalBtn = document.getElementById('cancel-modal-btn');
    const saveTaskBtn = document.getElementById('save-task-btn');
    const modalHeading = document.getElementById('modal-heading');

    const inputTitle = document.getElementById('task-input-title');
    const inputLabel = document.getElementById('task-input-label');
    const inputDate = document.getElementById('task-input-date');
    const inputNotes = document.getElementById('task-input-notes');
    const inputComment = document.getElementById('task-input-comment');
    const addCommentBtn = document.getElementById('add-comment-btn');
    const commentsList = document.getElementById('task-comments-list');
    const iconPickerContainer = document.getElementById('icon-picker');
    const spectrumColorInput = document.getElementById('task-spectrum-color');
    const spectrumHexLabel = document.getElementById('spectrum-hex-label');

    const ICONS = {
        design: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>`,
        code: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>`,
        database: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>`,
        api: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>`,
        bug: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="8" y="6" width="8" height="12" rx="4"/><line x1="6" y1="9" x2="8" y2="9"/><line x1="16" y1="9" x2="18" y2="9"/></svg>`,
        rocket: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="M12 15l-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-3.05 11a22.35 22.35 0 0 1-3.95 2z"/></svg>`
    };

    // State
    let TaskAetherStore = {
        tasks: {},
        workspaceBlocks: [],
        connections: [],
        textElements: [],
        shapes: [],
        drawings: []
    };

    let activeEditingTaskId = null;
    let currentIcon = 'design';
    let currentColorHex = '#a78bfa';
    let activeComments = [];

    let activeTool = 'select';
    let selectedShapeType = 'rectangle';
    let selectedBlockId = null;
    let selectedConnectionId = null;
    let selectedShapeId = null;
    let selectedTextId = null;

    let isDraggingBlock = false;
    let activeDragBlock = null;
    let dragOffset = { x: 0, y: 0 };

    let isDrawingArrow = false;
    let arrowStartBlock = null;
    let arrowStartAnchorDir = 'right';
    let tempArrowPath = null;
    let potentialTargetBlock = null;

    let isDrawingPencil = false;
    let isErasing = false;
    let currentStroke = [];

    let isDrawingShape = false;
    let shapeStartCoords = { x: 0, y: 0 };
    let tempShapePreviewG = null;

    let rafId = null;
    let saveDebounceTimer = null;

    // --- Performance Debounced LocalStorage Persistence ---
    function saveStateToStorage(immediate = false) {
        if (immediate) {
            if (saveDebounceTimer) clearTimeout(saveDebounceTimer);
            localStorage.setItem('taskaether_unified_store', JSON.stringify(TaskAetherStore));
            return;
        }
        if (saveDebounceTimer) clearTimeout(saveDebounceTimer);
        saveDebounceTimer = setTimeout(() => {
            localStorage.setItem('taskaether_unified_store', JSON.stringify(TaskAetherStore));
        }, 300);
    }

    function loadStateFromStorage() {
        const raw = localStorage.getItem('taskaether_unified_store');
        if (!raw) {
            TaskAetherStore = {
                tasks: {
                    't-1': { id: 't-1', title: 'Design System', label: 'Discovery', notes: 'Figma Token definitions', icon: 'design', colorHex: '#a78bfa', comments: [], inInbox: true },
                    't-2': { id: 't-2', title: 'Database Schema', label: 'Engineering', notes: 'PostgreSQL Relational layout', icon: 'database', colorHex: '#38bdf8', comments: [], inInbox: false }
                },
                workspaceBlocks: [
                    { id: 'b-2', taskId: 't-2', x: 280, y: 160, width: 220, height: 120 }
                ],
                connections: [],
                textElements: [],
                shapes: [],
                drawings: []
            };
            saveStateToStorage(true);
        } else {
            try {
                TaskAetherStore = JSON.parse(raw);
                if (!TaskAetherStore.textElements) TaskAetherStore.textElements = [];
                if (!TaskAetherStore.shapes) TaskAetherStore.shapes = [];
                if (!TaskAetherStore.drawings) TaskAetherStore.drawings = [];
            } catch(e) {
                console.error("Storage corrupted, resetting", e);
            }
        }

        resizeFreehandCanvas();
        updatePullButtonsVisibility();
        renderInbox();
        renderWorkspaceBlocks();
    }

    function resizeFreehandCanvas() {
        freehandCanvas.width = canvas.clientWidth;
        freehandCanvas.height = canvas.clientHeight;
        redrawFreehandCanvas();
    }
    window.addEventListener('resize', resizeFreehandCanvas);

    function getCanvasCoordinates(e) {
        const rect = canvas.getBoundingClientRect();
        return {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };
    }

    // Settings Dropdown
    if (railSettingsBtn && settingsDropdownMenu) {
        railSettingsBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            settingsDropdownMenu.classList.toggle('visible');
        });

        document.addEventListener('click', (e) => {
            if (!e.target.closest('#settings-dropdown-menu')) {
                settingsDropdownMenu.classList.remove('visible');
            }
        });
    }

    // Sidebar Collapses
    function updatePullButtonsVisibility() {
        const isInboxCollapsed = inboxSidebar.classList.contains('collapsed');
        const isRailCollapsed = railSidebar.classList.contains('collapsed');

        if (isInboxCollapsed) uncollapseInboxBtn.classList.remove('hidden');
        else uncollapseInboxBtn.classList.add('hidden');

        if (isRailCollapsed) uncollapseRailBtn.classList.remove('hidden');
        else uncollapseRailBtn.classList.add('hidden');
    }

    toggleRailBtn.addEventListener('click', () => {
        railSidebar.classList.add('collapsed');
        updatePullButtonsVisibility();
        setTimeout(resizeFreehandCanvas, 300);
    });

    toggleInboxBtn.addEventListener('click', () => {
        inboxSidebar.classList.add('collapsed');
        updatePullButtonsVisibility();
        setTimeout(resizeFreehandCanvas, 300);
    });

    uncollapseInboxBtn.addEventListener('click', () => {
        inboxSidebar.classList.remove('collapsed');
        updatePullButtonsVisibility();
        setTimeout(resizeFreehandCanvas, 300);
    });

    uncollapseRailBtn.addEventListener('click', () => {
        railSidebar.classList.remove('collapsed');
        updatePullButtonsVisibility();
        setTimeout(resizeFreehandCanvas, 300);
    });

    // Tool Modes
    function setActiveTool(tool) {
        activeTool = tool;
        [selectToolBtn, pencilToolBtn, eraserToolBtn, textToolBtn, shapeToolBtn].forEach(b => b.classList.remove('active-mode'));
        canvas.classList.remove('draw-mode', 'erase-mode');
        shapesPopupMenu.classList.remove('visible');

        if (tool === 'select') selectToolBtn.classList.add('active-mode');
        if (tool === 'pencil') {
            pencilToolBtn.classList.add('active-mode');
            canvas.classList.add('draw-mode');
        }
        if (tool === 'eraser') {
            eraserToolBtn.classList.add('active-mode');
            canvas.classList.add('erase-mode');
        }
        if (tool === 'text') textToolBtn.classList.add('active-mode');
        if (tool === 'shape') {
            shapeToolBtn.classList.add('active-mode');
            shapesPopupMenu.classList.add('visible');
        }
    }

    selectToolBtn.addEventListener('click', () => setActiveTool('select'));
    pencilToolBtn.addEventListener('click', () => setActiveTool('pencil'));
    eraserToolBtn.addEventListener('click', () => setActiveTool('eraser'));
    textToolBtn.addEventListener('click', () => setActiveTool('text'));
    shapeToolBtn.addEventListener('click', () => {
        if (activeTool === 'shape') shapesPopupMenu.classList.toggle('visible');
        else setActiveTool('shape');
    });

    shapesPopupMenu.querySelectorAll('.shape-opt-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            shapesPopupMenu.querySelectorAll('.shape-opt-btn').forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
            selectedShapeType = btn.dataset.shape;
            e.stopPropagation();
        });
    });

    globalFontSelector.addEventListener('change', (e) => {
        const selectedFont = e.target.value;
        if (selectedTextId) {
            const item = TaskAetherStore.textElements.find(t => t.id === selectedTextId);
            if (item) {
                item.fontFamily = selectedFont;
                saveStateToStorage(true);
                renderTextElements();
            }
        }
    });

    // Eraser
    function performEraseAt(x, y, radius = 20) {
        let stateChanged = false;

        const initialDrawCount = TaskAetherStore.drawings.length;
        TaskAetherStore.drawings = TaskAetherStore.drawings.filter(stroke => {
            if (!stroke.points) return true;
            return !stroke.points.some(pt => Math.hypot(pt.x - x, pt.y - y) <= radius);
        });
        if (TaskAetherStore.drawings.length !== initialDrawCount) {
            stateChanged = true;
            redrawFreehandCanvas();
        }

        const initialTextCount = TaskAetherStore.textElements.length;
        TaskAetherStore.textElements = TaskAetherStore.textElements.filter(txt => {
            const w = txt.width || 160;
            const h = txt.height || 60;
            return !(x >= txt.x - radius && x <= txt.x + w + radius && y >= txt.y - radius && y <= txt.y + h + radius);
        });
        if (TaskAetherStore.textElements.length !== initialTextCount) {
            stateChanged = true;
            renderTextElements();
        }

        const initialShapeCount = TaskAetherStore.shapes.length;
        TaskAetherStore.shapes = TaskAetherStore.shapes.filter(s => {
            const w = s.width || 100;
            const h = s.height || 60;
            return !(x >= s.x - radius && x <= s.x + w + radius && y >= s.y - radius && y <= s.y + h + radius);
        });
        if (TaskAetherStore.shapes.length !== initialShapeCount) {
            stateChanged = true;
            renderShapes();
        }

        const initialConnCount = TaskAetherStore.connections.length;
        TaskAetherStore.connections = TaskAetherStore.connections.filter(conn => {
            const fromEl = document.getElementById(conn.fromBlockId);
            const toEl = document.getElementById(conn.toBlockId);
            if (!fromEl || !toEl) return true;

            const startPt = getBestAnchorPoint(fromEl, getBlockRect(toEl));
            const endPt = getBestAnchorPoint(toEl, getBlockRect(fromEl));

            for (let t = 0; t <= 1; t += 0.05) {
                const px = (1 - t) * startPt.x + t * endPt.x;
                const py = (1 - t) * startPt.y + t * endPt.y;
                if (Math.hypot(px - x, py - y) <= radius + 5) return false;
            }
            return true;
        });
        if (TaskAetherStore.connections.length !== initialConnCount) {
            stateChanged = true;
            renderConnections();
        }

        if (stateChanged) saveStateToStorage();
    }

    // Canvas Events
    canvas.addEventListener('contextmenu', (e) => {
        if (activeTool === 'eraser' || isErasing) e.preventDefault();
    });

    freehandCanvas.addEventListener('mousedown', (e) => {
        const coords = getCanvasCoordinates(e);

        if (activeTool === 'eraser' || e.button === 2) {
            isErasing = true;
            performEraseAt(coords.x, coords.y);
            return;
        }

        if (activeTool === 'pencil' && e.button === 0) {
            isDrawingPencil = true;
            currentStroke = [{ x: coords.x, y: coords.y }];
            return;
        }

        if (activeTool === 'shape' && e.button === 0) {
            isDrawingShape = true;
            shapeStartCoords = { x: coords.x, y: coords.y };

            tempShapePreviewG = document.createElementNS('http://www.w3.org/2000/svg', 'g');
            svgLayer.appendChild(tempShapePreviewG);
        }
    });

    // Frame-Optimized Mousemove Handlers
    document.addEventListener('mousemove', (e) => {
        if (rafId) return;

        rafId = requestAnimationFrame(() => {
            rafId = null;
            const coords = getCanvasCoordinates(e);

            if (isErasing) {
                performEraseAt(coords.x, coords.y);
                return;
            }

            if (isDrawingPencil && activeTool === 'pencil') {
                currentStroke.push({ x: coords.x, y: coords.y });
                ctx.strokeStyle = shapeColorPicker.value || '#38bdf8';
                ctx.lineWidth = 3;
                ctx.lineCap = 'round';
                ctx.lineJoin = 'round';
                ctx.beginPath();
                const p1 = currentStroke[currentStroke.length - 2];
                const p2 = currentStroke[currentStroke.length - 1];
                ctx.moveTo(p1.x, p1.y);
                ctx.lineTo(p2.x, p2.y);
                ctx.stroke();
                return;
            }

            if (isDrawingShape && tempShapePreviewG) {
                tempShapePreviewG.innerHTML = '';
                const x = Math.min(shapeStartCoords.x, coords.x);
                const y = Math.min(shapeStartCoords.y, coords.y);
                const w = Math.abs(coords.x - shapeStartCoords.x);
                const h = Math.abs(coords.y - shapeStartCoords.y);
                const color = shapeColorPicker.value || '#38bdf8';

                let elem;
                if (selectedShapeType === 'rectangle' || selectedShapeType === 'square') {
                    const side = selectedShapeType === 'square' ? Math.max(w, h) : w;
                    elem = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
                    elem.setAttribute('x', x);
                    elem.setAttribute('y', y);
                    elem.setAttribute('width', side);
                    elem.setAttribute('height', selectedShapeType === 'square' ? side : h);
                    elem.setAttribute('rx', '8');
                } else if (selectedShapeType === 'triangle') {
                    elem = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
                    elem.setAttribute('points', `${x + w / 2},${y} ${x},${y + h} ${x + w},${y + h}`);
                } else if (selectedShapeType === 'line') {
                    elem = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                    elem.setAttribute('x1', shapeStartCoords.x);
                    elem.setAttribute('y1', shapeStartCoords.y);
                    elem.setAttribute('x2', coords.x);
                    elem.setAttribute('y2', coords.y);
                } else if (selectedShapeType === 'curved-line') {
                    elem = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                    elem.setAttribute('d', `M ${shapeStartCoords.x} ${shapeStartCoords.y} Q ${x + w / 2} ${y - 30}, ${coords.x} ${coords.y}`);
                }

                if (elem) {
                    elem.setAttribute('fill', 'transparent');
                    elem.setAttribute('stroke', color);
                    elem.setAttribute('stroke-width', '2.5');
                    elem.setAttribute('stroke-dasharray', '4 4');
                    tempShapePreviewG.appendChild(elem);
                }
                return;
            }

            if (isDraggingBlock && activeDragBlock) {
                activeDragBlock.x = Math.max(0, coords.x - dragOffset.x);
                activeDragBlock.y = Math.max(0, coords.y - dragOffset.y);

                const el = document.getElementById(activeDragBlock.id);
                if (el) {
                    el.style.left = `${activeDragBlock.x}px`;
                    el.style.top = `${activeDragBlock.y}px`;
                }
                updateConnectionsInPlace();
                saveStateToStorage();
                return;
            }

            if (isDrawingArrow && arrowStartBlock && tempArrowPath) {
                const startPt = getAnchorPointBySide(arrowStartBlock, arrowStartAnchorDir);
                const curve = calculateBezierPath(startPt, coords);
                tempArrowPath.setAttribute('d', curve);

                const elemBelow = document.elementFromPoint(e.clientX, e.clientY);
                const targetBlock = elemBelow ? elemBelow.closest('.workspace-block') : null;

                if (potentialTargetBlock && potentialTargetBlock !== targetBlock) {
                    potentialTargetBlock.classList.remove('valid-target');
                    potentialTargetBlock = null;
                }

                if (targetBlock && targetBlock !== arrowStartBlock) {
                    const isDup = TaskAetherStore.connections.some(c => c.fromBlockId === arrowStartBlock.id && c.toBlockId === targetBlock.id);
                    if (!isDup) {
                        potentialTargetBlock = targetBlock;
                        potentialTargetBlock.classList.add('valid-target');
                    }
                }
            }
        });
    });

    window.addEventListener('mouseup', () => {
        isErasing = false;

        if (isDrawingPencil) {
            isDrawingPencil = false;
            if (currentStroke.length > 1) {
                TaskAetherStore.drawings.push({
                    id: `draw-${Date.now()}`,
                    color: shapeColorPicker.value || '#38bdf8',
                    points: [...currentStroke]
                });
                saveStateToStorage(true);
            }
            currentStroke = [];
        }

        if (isDrawingShape) {
            isDrawingShape = false;
            if (tempShapePreviewG) tempShapePreviewG.remove();

            const coords = { x: event.clientX, y: event.clientY };
            const rect = canvas.getBoundingClientRect();
            const canvasCoords = { x: coords.x - rect.left, y: coords.y - rect.top };

            const x = Math.min(shapeStartCoords.x, canvasCoords.x);
            const y = Math.min(shapeStartCoords.y, canvasCoords.y);
            const w = Math.max(20, Math.abs(canvasCoords.x - shapeStartCoords.x));
            const h = Math.max(20, Math.abs(canvasCoords.y - shapeStartCoords.y));

            const newShape = {
                id: `shape-${Date.now()}`,
                type: selectedShapeType,
                x, y,
                width: selectedShapeType === 'square' ? Math.max(w, h) : w,
                height: selectedShapeType === 'square' ? Math.max(w, h) : h,
                color: shapeColorPicker.value || '#38bdf8'
            };

            TaskAetherStore.shapes.push(newShape);
            saveStateToStorage(true);
            renderShapes();
            setActiveTool('select');
        }

        if (isDraggingBlock) {
            isDraggingBlock = false;
            activeDragBlock = null;
            saveStateToStorage(true);
        }

        if (isDrawingArrow) {
            if (tempArrowPath) tempArrowPath.remove();

            if (potentialTargetBlock && arrowStartBlock) {
                const fromId = arrowStartBlock.id;
                const toId = potentialTargetBlock.id;

                if (fromId !== toId) {
                    const exists = TaskAetherStore.connections.some(c => c.fromBlockId === fromId && c.toBlockId === toId);
                    if (!exists) {
                        TaskAetherStore.connections.push({
                            id: `conn-${Date.now()}`,
                            fromBlockId: fromId,
                            toBlockId: toId,
                            color: '#818cf8'
                        });
                        saveStateToStorage(true);
                        renderConnections();
                    }
                }
            }

            if (potentialTargetBlock) {
                potentialTargetBlock.classList.remove('valid-target');
                potentialTargetBlock = null;
            }

            isDrawingArrow = false;
            arrowStartBlock = null;
            tempArrowPath = null;
        }
    });

    function redrawFreehandCanvas() {
        ctx.clearRect(0, 0, freehandCanvas.width, freehandCanvas.height);
        TaskAetherStore.drawings.forEach(stroke => {
            if (!stroke.points || stroke.points.length < 2) return;
            ctx.strokeStyle = stroke.color;
            ctx.lineWidth = 3;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.beginPath();
            ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
            for (let i = 1; i < stroke.points.length; i++) {
                ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
            }
            ctx.stroke();
        });
    }

    // Text Elements
    function renderTextElements() {
        canvas.querySelectorAll('.workspace-text-box').forEach(el => el.remove());

        TaskAetherStore.textElements.forEach(item => {
            const el = document.createElement('div');
            el.className = `workspace-text-box ${item.id === selectedTextId ? 'selected' : ''}`;
            el.contentEditable = 'true';
            el.id = item.id;
            el.style.left = `${item.x}px`;
            el.style.top = `${item.y}px`;
            if (item.width) el.style.width = `${item.width}px`;
            if (item.height) el.style.height = `${item.height}px`;
            el.style.fontFamily = item.fontFamily || "'Plus Jakarta Sans', sans-serif";
            el.innerText = item.content || 'Type here...';

            function updateFontSizeByDimensions(w, h) {
                const calculatedFontSize = Math.max(12, Math.min(80, Math.floor(h * 0.38)));
                el.style.fontSize = `${calculatedFontSize}px`;
            }

            updateFontSizeByDimensions(item.width || 160, item.height || 60);

            const resizeObserver = new ResizeObserver(entries => {
                for (let entry of entries) {
                    const newW = entry.contentRect.width;
                    const newH = entry.contentRect.height;
                    updateFontSizeByDimensions(newW, newH);
                    item.width = newW;
                    item.height = newH;
                    saveStateToStorage();
                }
            });
            resizeObserver.observe(el);

            el.addEventListener('focus', () => {
                clearSelections();
                selectedTextId = item.id;
                el.classList.add('selected');
                globalFontSelector.value = item.fontFamily || "'Plus Jakarta Sans', sans-serif";
            });

            el.addEventListener('mousedown', (e) => {
                if (document.activeElement === el) return;
                clearSelections();
                selectedTextId = item.id;
                el.classList.add('selected');
                globalFontSelector.value = item.fontFamily || "'Plus Jakarta Sans', sans-serif";

                isDraggingBlock = true;
                activeDragBlock = item;
                const coords = getCanvasCoordinates(e);
                dragOffset.x = coords.x - item.x;
                dragOffset.y = coords.y - item.y;
            });

            el.addEventListener('blur', () => {
                item.content = el.innerText;
                saveStateToStorage(true);
            });

            canvas.appendChild(el);
        });
    }

    // Shapes Renderer
    function renderShapes() {
        svgLayer.querySelectorAll('.workspace-shape-element').forEach(el => el.remove());

        TaskAetherStore.shapes.forEach(shape => {
            const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
            g.setAttribute('class', `workspace-shape-element ${shape.id === selectedShapeId ? 'selected' : ''}`);
            g.setAttribute('id', shape.id);

            const w = shape.width || 100;
            const h = shape.height || 60;

            let element;
            if (shape.type === 'rectangle' || shape.type === 'square') {
                element = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
                element.setAttribute('x', shape.x);
                element.setAttribute('y', shape.y);
                element.setAttribute('width', w);
                element.setAttribute('height', h);
                element.setAttribute('rx', '8');
                element.setAttribute('fill', 'transparent');
                element.setAttribute('stroke', shape.color);
                element.setAttribute('stroke-width', '2.5');
            } else if (shape.type === 'triangle') {
                element = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
                const p1 = `${shape.x + w / 2},${shape.y}`;
                const p2 = `${shape.x},${shape.y + h}`;
                const p3 = `${shape.x + w},${shape.y + h}`;
                element.setAttribute('points', `${p1} ${p2} ${p3}`);
                element.setAttribute('fill', 'transparent');
                element.setAttribute('stroke', shape.color);
                element.setAttribute('stroke-width', '2.5');
            } else if (shape.type === 'line') {
                element = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                element.setAttribute('x1', shape.x);
                element.setAttribute('y1', shape.y);
                element.setAttribute('x2', shape.x + w);
                element.setAttribute('y2', shape.y + h);
                element.setAttribute('stroke', shape.color);
                element.setAttribute('stroke-width', '3');
            } else if (shape.type === 'curved-line') {
                element = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                const d = `M ${shape.x} ${shape.y} Q ${shape.x + w / 2} ${shape.y - 30}, ${shape.x + w} ${shape.y + h}`;
                element.setAttribute('d', d);
                element.setAttribute('fill', 'none');
                element.setAttribute('stroke', shape.color);
                element.setAttribute('stroke-width', '3');
            }

            if (element) {
                element.style.cursor = 'move';
                element.addEventListener('mousedown', (e) => {
                    e.stopPropagation();
                    clearSelections();
                    selectedShapeId = shape.id;
                    isDraggingBlock = true;
                    activeDragBlock = shape;
                    const coords = getCanvasCoordinates(e);
                    dragOffset.x = coords.x - shape.x;
                    dragOffset.y = coords.y - shape.y;
                });
                g.appendChild(element);
                svgLayer.appendChild(g);
            }
        });
    }

    canvas.addEventListener('click', (e) => {
        if (e.target.closest('#bottom-toolbar-trigger-zone') || e.target.closest('.context-color-menu')) return;
        arrowContextMenu.classList.remove('visible');

        const coords = getCanvasCoordinates(e);

        if (activeTool === 'text' && e.target === canvas) {
            const newText = {
                id: `text-${Date.now()}`,
                x: coords.x,
                y: coords.y,
                width: 160,
                height: 60,
                fontFamily: globalFontSelector.value,
                content: 'Type here...'
            };
            TaskAetherStore.textElements.push(newText);
            saveStateToStorage(true);
            renderTextElements();
            setActiveTool('select');
            return;
        }

        if (e.target === canvas) clearSelections();
    });

    spectrumColorInput.addEventListener('input', (e) => {
        currentColorHex = e.target.value;
        spectrumHexLabel.innerText = currentColorHex;
        updateLivePreview();
    });

    function initEditorPickers() {
        iconPickerContainer.innerHTML = '';
        Object.keys(ICONS).forEach(key => {
            const opt = document.createElement('div');
            opt.className = `icon-option ${key === currentIcon ? 'selected' : ''}`;
            opt.innerHTML = ICONS[key];
            opt.addEventListener('click', () => {
                currentIcon = key;
                document.querySelectorAll('.icon-option').forEach(el => el.classList.remove('selected'));
                opt.classList.add('selected');
                updateLivePreview();
            });
            iconPickerContainer.appendChild(opt);
        });

        spectrumColorInput.value = currentColorHex;
        spectrumHexLabel.innerText = currentColorHex;
    }

    function updateLivePreview() {
        const previewTitle = document.getElementById('preview-title');
        const previewNotes = document.getElementById('preview-notes');
        const previewTag = document.getElementById('preview-tag');
        const previewDate = document.getElementById('preview-date');
        const previewIconBox = document.getElementById('preview-icon-box');
        const previewIconSvg = document.getElementById('preview-icon-svg');

        if (previewTitle) previewTitle.innerText = inputTitle.value.trim() || 'Task Title';
        if (previewNotes) previewNotes.innerText = inputNotes.value.trim() || 'Notes preview will show here...';
        if (previewTag) previewTag.innerText = inputLabel.value.trim() || 'Label';
        if (previewDate) previewDate.innerText = inputDate.value.trim() || '';

        if (previewIconSvg) previewIconSvg.innerHTML = ICONS[currentIcon] || ICONS.design;
        if (previewIconBox) {
            previewIconBox.style.color = currentColorHex;
            previewIconBox.style.backgroundColor = `${currentColorHex}25`;
            previewIconBox.style.border = `1px solid ${currentColorHex}50`;
        }

        if (previewTag) {
            previewTag.style.color = currentColorHex;
            previewTag.style.backgroundColor = `${currentColorHex}25`;
            previewTag.style.border = `1px solid ${currentColorHex}50`;
        }
    }

    [inputTitle, inputNotes, inputLabel, inputDate].forEach(elem => elem.addEventListener('input', updateLivePreview));

    addCommentBtn.addEventListener('click', () => {
        const text = inputComment.value.trim();
        if (!text) return;
        activeComments.push({ id: `c-${Date.now()}`, text });
        inputComment.value = '';
        renderComments();
    });

    function renderComments() {
        commentsList.innerHTML = '';
        activeComments.forEach(c => {
            const item = document.createElement('div');
            item.className = 'comment-item';
            item.innerHTML = `<span>${c.text}</span><span class="comment-delete" data-id="${c.id}">&times;</span>`;
            item.querySelector('.comment-delete').addEventListener('click', () => {
                activeComments = activeComments.filter(x => x.id !== c.id);
                renderComments();
            });
            commentsList.appendChild(item);
        });
    }

    function renderTaskCardHTML(task, isWorkspace = false) {
        const hex = task.colorHex || '#a78bfa';
        const iconSvg = ICONS[task.icon] || ICONS.design;

        return `
            <div class="task-card-element" data-task-id="${task.id}">
                <div class="card-header">
                    <div class="card-icon-box" style="color: ${hex}; background: ${hex}25; border: 1px solid ${hex}50">
                        ${iconSvg}
                    </div>
                    <span class="card-title-text">${task.title}</span>
                    <div class="card-actions-menu">
                        <button class="card-action-btn edit-task-action" title="Edit Task">✎</button>
                        <button class="card-action-btn delete-task-action" title="Delete Task">&times;</button>
                    </div>
                </div>
                ${task.notes ? `<p class="card-notes-text">${task.notes}</p>` : ''}
                <div class="card-footer-meta">
                    ${task.label ? `<span class="card-tag-pill" style="color:${hex}; background:${hex}25; border:1px solid ${hex}50">${task.label}</span>` : ''}
                    ${task.dueDate ? `<span class="card-date-pill">${task.dueDate}</span>` : ''}
                </div>
            </div>
            ${isWorkspace ? `
                <div class="connection-handle handle-top" data-side="top"></div>
                <div class="connection-handle handle-top-right" data-side="top-right"></div>
                <div class="connection-handle handle-right" data-side="right"></div>
                <div class="connection-handle handle-bottom-right" data-side="bottom-right"></div>
                <div class="connection-handle handle-bottom" data-side="bottom"></div>
                <div class="connection-handle handle-bottom-left" data-side="bottom-left"></div>
                <div class="connection-handle handle-left" data-side="left"></div>
                <div class="connection-handle handle-top-left" data-side="top-left"></div>
            ` : ''}
        `;
    }

    function renderInbox() {
        inboxTaskList.innerHTML = '';
        const availableTasks = Object.keys(TaskAetherStore.tasks).filter(id => {
            const task = TaskAetherStore.tasks[id];
            return task && task.inInbox !== false;
        });

        inboxCountBadge.innerText = availableTasks.length;

        availableTasks.forEach(id => {
            const task = TaskAetherStore.tasks[id];
            const cardWrapper = document.createElement('div');
            cardWrapper.innerHTML = renderTaskCardHTML(task, false);
            const cardElement = cardWrapper.firstElementChild;
            cardElement.setAttribute('draggable', 'true');

            cardElement.addEventListener('dragstart', (e) => {
                e.dataTransfer.setData('application/json', JSON.stringify({ taskId: task.id, origin: 'inbox' }));
            });

            cardElement.querySelector('.edit-task-action').addEventListener('click', (e) => {
                e.stopPropagation();
                openTaskModal(task.id);
            });

            cardElement.querySelector('.delete-task-action').addEventListener('click', (e) => {
                e.stopPropagation();
                deleteTaskCompletely(task.id);
            });

            inboxTaskList.appendChild(cardElement);
        });
    }

    // Drag Workspace Cards back to Tasks
    inboxSidebar.addEventListener('dragover', (e) => {
        e.preventDefault();
        inboxSidebar.classList.add('drop-target-active');
    });

    inboxSidebar.addEventListener('dragleave', () => {
        inboxSidebar.classList.remove('drop-target-active');
    });

    inboxSidebar.addEventListener('drop', (e) => {
        e.preventDefault();
        inboxSidebar.classList.remove('drop-target-active');

        const rawData = e.dataTransfer.getData('application/json');
        if (!rawData) return;
        const { taskId, blockId, origin } = JSON.parse(rawData);

        if (origin === 'workspace' && blockId) {
            if (TaskAetherStore.tasks[taskId]) {
                TaskAetherStore.tasks[taskId].inInbox = true;
            }
            TaskAetherStore.workspaceBlocks = TaskAetherStore.workspaceBlocks.filter(b => b.id !== blockId);
            TaskAetherStore.connections = TaskAetherStore.connections.filter(c => c.fromBlockId !== blockId && c.toBlockId !== blockId);

            saveStateToStorage(true);
            renderInbox();
            renderWorkspaceBlocks();
        }
    });

    canvas.addEventListener('dragover', (e) => e.preventDefault());
    canvas.addEventListener('drop', (e) => {
        e.preventDefault();
        const rawData = e.dataTransfer.getData('application/json');
        if (!rawData) return;
        const { taskId, origin } = JSON.parse(rawData);
        if (origin !== 'inbox') return;

        const coords = getCanvasCoordinates(e);

        const newBlock = {
            id: `block-${Date.now()}`,
            taskId: taskId,
            x: Math.max(0, coords.x - 100),
            y: Math.max(0, coords.y - 40),
            width: 220,
            height: 120
        };

        if (TaskAetherStore.tasks[taskId]) {
            TaskAetherStore.tasks[taskId].inInbox = false;
        }

        TaskAetherStore.workspaceBlocks.push(newBlock);
        saveStateToStorage(true);
        renderInbox();
        renderWorkspaceBlocks();
    });

    function renderWorkspaceBlocks() {
        canvas.querySelectorAll('.workspace-block').forEach(el => el.remove());

        TaskAetherStore.workspaceBlocks.forEach(block => {
            const task = TaskAetherStore.tasks[block.taskId];
            if (!task) return;

            const blockEl = document.createElement('div');
            blockEl.className = `workspace-block ${block.id === selectedBlockId ? 'selected' : ''}`;
            blockEl.id = block.id;
            blockEl.style.left = `${block.x}px`;
            blockEl.style.top = `${block.y}px`;
            if (block.width) blockEl.style.width = `${block.width}px`;
            if (block.height) blockEl.style.height = `${block.height}px`;

            blockEl.innerHTML = renderTaskCardHTML(task, true);

            const cardContent = blockEl.querySelector('.task-card-element');
            if (cardContent) {
                cardContent.setAttribute('draggable', 'true');
                cardContent.addEventListener('dragstart', (e) => {
                    e.dataTransfer.setData('application/json', JSON.stringify({
                        taskId: task.id,
                        blockId: block.id,
                        origin: 'workspace'
                    }));
                });
            }

            const cardResizeObserver = new ResizeObserver(entries => {
                for (let entry of entries) {
                    const newW = entry.contentRect.width;
                    const newH = entry.contentRect.height;
                    block.width = newW;
                    block.height = newH;

                    const baseScale = Math.max(0.7, Math.min(2.5, newH / 110));
                    const titleEl = blockEl.querySelector('.card-title-text');
                    const notesEl = blockEl.querySelector('.card-notes-text');
                    const tagEl = blockEl.querySelector('.card-tag-pill');
                    const dateEl = blockEl.querySelector('.card-date-pill');
                    const iconBox = blockEl.querySelector('.card-icon-box');

                    if (titleEl) titleEl.style.fontSize = `${0.85 * baseScale}rem`;
                    if (notesEl) notesEl.style.fontSize = `${0.75 * baseScale}rem`;
                    if (tagEl) tagEl.style.fontSize = `${0.65 * baseScale}rem`;
                    if (dateEl) dateEl.style.fontSize = `${0.65 * baseScale}rem`;
                    if (iconBox) {
                        iconBox.style.width = `${28 * baseScale}px`;
                        iconBox.style.height = `${28 * baseScale}px`;
                    }

                    saveStateToStorage();
                    updateConnectionsInPlace();
                }
            });
            cardResizeObserver.observe(blockEl);

            attachBlockEventListeners(blockEl, block);
            canvas.appendChild(blockEl);
        });

        renderConnections();
        renderShapes();
        renderTextElements();
    }

    function attachBlockEventListeners(blockEl, blockData) {
        blockEl.querySelector('.edit-task-action').addEventListener('click', (e) => {
            e.stopPropagation();
            openTaskModal(blockData.taskId);
        });

        blockEl.querySelector('.delete-task-action').addEventListener('click', (e) => {
            e.stopPropagation();
            TaskAetherStore.workspaceBlocks = TaskAetherStore.workspaceBlocks.filter(b => b.id !== blockData.id);
            TaskAetherStore.connections = TaskAetherStore.connections.filter(c => c.fromBlockId !== blockData.id && c.toBlockId !== blockData.id);
            
            if (TaskAetherStore.tasks[blockData.taskId]) {
                TaskAetherStore.tasks[blockData.taskId].inInbox = true;
            }

            saveStateToStorage(true);
            renderInbox();
            renderWorkspaceBlocks();
        });

        blockEl.addEventListener('mousedown', (e) => {
            if (e.target.classList.contains('connection-handle')) return;
            clearSelections();
            selectedBlockId = blockData.id;
            blockEl.classList.add('selected');

            isDraggingBlock = true;
            activeDragBlock = blockData;
            const coords = getCanvasCoordinates(e);
            dragOffset.x = coords.x - blockData.x;
            dragOffset.y = coords.y - blockData.y;
            e.stopPropagation();
        });

        blockEl.querySelectorAll('.connection-handle').forEach(handle => {
            handle.addEventListener('mousedown', (e) => {
                e.stopPropagation();
                clearSelections();

                isDrawingArrow = true;
                arrowStartBlock = blockEl;
                arrowStartAnchorDir = handle.dataset.side || 'right';

                tempArrowPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                tempArrowPath.setAttribute('class', 'connection-path-temp');
                tempArrowPath.setAttribute('stroke', '#818cf8');
                tempArrowPath.setAttribute('stroke-width', '2.5');
                tempArrowPath.setAttribute('stroke-dasharray', '6,6');
                tempArrowPath.setAttribute('fill', 'none');
                tempArrowPath.setAttribute('marker-end', 'url(#arrow)');
                svgLayer.appendChild(tempArrowPath);
            });
        });
    }

    function clearSelections() {
        if (selectedBlockId) {
            const el = document.getElementById(selectedBlockId);
            if (el) el.classList.remove('selected');
            selectedBlockId = null;
        }
        selectedConnectionId = null;
        selectedShapeId = null;
        selectedTextId = null;
        renderConnections();
        renderShapes();
    }

    // Anchors & Connections
    function getBlockRect(blockEl) {
        return {
            left: parseFloat(blockEl.style.left),
            top: parseFloat(blockEl.style.top),
            width: blockEl.offsetWidth,
            height: blockEl.offsetHeight
        };
    }

    function getAnchorPointBySide(blockEl, side) {
        const r = getBlockRect(blockEl);
        switch (side) {
            case 'top':          return { x: r.left + r.width / 2, y: r.top, dir: 'top' };
            case 'top-right':    return { x: r.left + r.width, y: r.top, dir: 'top-right' };
            case 'right':        return { x: r.left + r.width, y: r.top + r.height / 2, dir: 'right' };
            case 'bottom-right': return { x: r.left + r.width, y: r.top + r.height, dir: 'bottom-right' };
            case 'bottom':       return { x: r.left + r.width / 2, y: r.top + r.height, dir: 'bottom' };
            case 'bottom-left':  return { x: r.left, y: r.top + r.height, dir: 'bottom-left' };
            case 'left':         return { x: r.left, y: r.top + r.height / 2, dir: 'left' };
            case 'top-left':     return { x: r.left, y: r.top, dir: 'top-left' };
            default:             return { x: r.left + r.width, y: r.top + r.height / 2, dir: 'right' };
        }
    }

    function getBestAnchorPoint(fromBlockEl, toRect) {
        const from = getBlockRect(fromBlockEl);
        const fromCenter = { x: from.left + from.width / 2, y: from.top + from.height / 2 };
        const toCenter = { x: toRect.left + toRect.width / 2, y: toRect.top + toRect.height / 2 };

        const dx = toCenter.x - fromCenter.x;
        const dy = toCenter.y - fromCenter.y;

        if (Math.abs(dx) > Math.abs(dy) * 1.5) {
            return dx > 0 
                ? getAnchorPointBySide(fromBlockEl, 'right')
                : getAnchorPointBySide(fromBlockEl, 'left');
        } else if (Math.abs(dy) > Math.abs(dx) * 1.5) {
            return dy > 0 
                ? getAnchorPointBySide(fromBlockEl, 'bottom')
                : getAnchorPointBySide(fromBlockEl, 'top');
        } else {
            if (dx > 0 && dy > 0) return getAnchorPointBySide(fromBlockEl, 'bottom-right');
            if (dx > 0 && dy < 0) return getAnchorPointBySide(fromBlockEl, 'top-right');
            if (dx < 0 && dy > 0) return getAnchorPointBySide(fromBlockEl, 'bottom-left');
            return getAnchorPointBySide(fromBlockEl, 'top-left');
        }
    }

    function calculateBezierPath(p1, p2) {
        const dx = Math.abs(p2.x - p1.x) * 0.5;
        const dy = Math.abs(p2.y - p1.y) * 0.5;
        let cx1 = p1.x, cy1 = p1.y;

        if (p1.dir === 'right') cx1 += dx;
        else if (p1.dir === 'left') cx1 -= dx;
        else if (p1.dir === 'bottom') cy1 += dy;
        else if (p1.dir === 'top') cy1 -= dy;
        else { cx1 += dx; cy1 += dy; }

        return `M ${p1.x} ${p1.y} C ${cx1} ${cy1}, ${p2.x} ${p2.y}, ${p2.x} ${p2.y}`;
    }

    function renderConnections() {
        svgLayer.querySelectorAll('.connection-path').forEach(el => el.remove());

        TaskAetherStore.connections.forEach(conn => {
            const fromEl = document.getElementById(conn.fromBlockId);
            const toEl = document.getElementById(conn.toBlockId);
            if (!fromEl || !toEl) return;

            const startPt = getBestAnchorPoint(fromEl, getBlockRect(toEl));
            const endPt = getBestAnchorPoint(toEl, getBlockRect(fromEl));
            const curve = calculateBezierPath(startPt, endPt);

            const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            const isSelected = conn.id === selectedConnectionId;
            const strokeColor = conn.color || '#818cf8';

            path.setAttribute('class', `connection-path ${isSelected ? 'selected' : ''}`);
            path.setAttribute('data-conn-id', conn.id);
            path.setAttribute('d', curve);
            path.setAttribute('stroke', strokeColor);
            path.setAttribute('stroke-width', isSelected ? '3.5' : '2.5');
            path.setAttribute('fill', 'none');
            path.setAttribute('marker-end', 'url(#arrow)');

            path.addEventListener('click', (e) => {
                e.stopPropagation();
                clearSelections();
                selectedConnectionId = conn.id;
                renderConnections();
            });

            path.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                e.stopPropagation();
                selectedConnectionId = conn.id;

                arrowContextMenu.style.top = `${e.clientY}px`;
                arrowContextMenu.style.left = `${e.clientX}px`;
                arrowContextMenu.classList.add('visible');
            });

            svgLayer.appendChild(path);
        });
    }

    // Frame-Optimized Fast Update for Arrows (no DOM rebuilding)
    function updateConnectionsInPlace() {
        TaskAetherStore.connections.forEach(conn => {
            const path = svgLayer.querySelector(`[data-conn-id="${conn.id}"]`);
            if (!path) return;
            const fromEl = document.getElementById(conn.fromBlockId);
            const toEl = document.getElementById(conn.toBlockId);
            if (!fromEl || !toEl) return;

            const startPt = getBestAnchorPoint(fromEl, getBlockRect(toEl));
            const endPt = getBestAnchorPoint(toEl, getBlockRect(fromEl));
            const curve = calculateBezierPath(startPt, endPt);

            path.setAttribute('d', curve);
        });
    }

    arrowContextMenu.querySelectorAll('.color-dot').forEach(dot => {
        dot.addEventListener('click', () => {
            if (selectedConnectionId) {
                const conn = TaskAetherStore.connections.find(c => c.id === selectedConnectionId);
                if (conn) conn.color = dot.dataset.color;
                saveStateToStorage(true);
                renderConnections();
            }
            arrowContextMenu.classList.remove('visible');
        });
    });

    arrowCustomColor.addEventListener('input', (e) => {
        if (selectedConnectionId) {
            const conn = TaskAetherStore.connections.find(c => c.id === selectedConnectionId);
            if (conn) conn.color = e.target.value;
            saveStateToStorage();
            renderConnections();
        }
    });

    // Modal Operations
    function openTaskModal(taskId = null) {
        activeEditingTaskId = taskId;
        initEditorPickers();

        if (taskId && TaskAetherStore.tasks[taskId]) {
            const t = TaskAetherStore.tasks[taskId];
            modalHeading.innerText = 'Edit Task';
            inputTitle.value = t.title || '';
            inputLabel.value = t.label || '';
            inputDate.value = t.dueDate || '';
            inputNotes.value = t.notes || '';
            currentIcon = t.icon || 'design';
            currentColorHex = t.colorHex || '#a78bfa';
            activeComments = [...(t.comments || [])];
        } else {
            modalHeading.innerText = 'Create Task';
            inputTitle.value = '';
            inputLabel.value = '';
            inputDate.value = '';
            inputNotes.value = '';
            currentIcon = 'design';
            currentColorHex = '#a78bfa';
            activeComments = [];
        }

        renderComments();
        updateLivePreview();
        modalBackdrop.classList.add('active');
    }

    function closeTaskModal() {
        modalBackdrop.classList.remove('active');
        activeEditingTaskId = null;
    }

    openAddTaskBtn.addEventListener('click', () => openTaskModal());
    closeModalBtn.addEventListener('click', closeTaskModal);
    cancelModalBtn.addEventListener('click', closeTaskModal);

    saveTaskBtn.addEventListener('click', () => {
        const title = inputTitle.value.trim() || 'Untitled Task';

        if (activeEditingTaskId) {
            const t = TaskAetherStore.tasks[activeEditingTaskId];
            t.title = title;
            t.label = inputLabel.value.trim();
            t.dueDate = inputDate.value.trim();
            t.notes = inputNotes.value.trim();
            t.icon = currentIcon;
            t.colorHex = currentColorHex;
            t.comments = [...activeComments];
        } else {
            const newId = `task-${Date.now()}`;
            TaskAetherStore.tasks[newId] = {
                id: newId,
                title,
                label: inputLabel.value.trim(),
                dueDate: inputDate.value.trim(),
                notes: inputNotes.value.trim(),
                icon: currentIcon,
                colorHex: currentColorHex,
                comments: [...activeComments],
                inInbox: true
            };
        }

        saveStateToStorage(true);
        renderInbox();
        renderWorkspaceBlocks();
        closeTaskModal();
    });

    function deleteTaskCompletely(taskId) {
        delete TaskAetherStore.tasks[taskId];
        const blocksToRemove = TaskAetherStore.workspaceBlocks.filter(b => b.taskId === taskId).map(b => b.id);
        TaskAetherStore.workspaceBlocks = TaskAetherStore.workspaceBlocks.filter(b => b.taskId !== taskId);
        TaskAetherStore.connections = TaskAetherStore.connections.filter(c => !blocksToRemove.includes(c.fromBlockId) && !blocksToRemove.includes(c.toBlockId));

        saveStateToStorage(true);
        renderInbox();
        renderWorkspaceBlocks();
    }

    deleteSelectedBtn.addEventListener('click', deleteSelectedEntity);

    function deleteSelectedEntity() {
        if (selectedBlockId) {
            const block = TaskAetherStore.workspaceBlocks.find(b => b.id === selectedBlockId);
            if (block && TaskAetherStore.tasks[block.taskId]) {
                TaskAetherStore.tasks[block.taskId].inInbox = true;
            }
            TaskAetherStore.workspaceBlocks = TaskAetherStore.workspaceBlocks.filter(b => b.id !== selectedBlockId);
            TaskAetherStore.connections = TaskAetherStore.connections.filter(c => c.fromBlockId !== selectedBlockId && c.toBlockId !== selectedBlockId);
            selectedBlockId = null;
        } else if (selectedConnectionId) {
            TaskAetherStore.connections = TaskAetherStore.connections.filter(c => c.id !== selectedConnectionId);
            selectedConnectionId = null;
        } else if (selectedShapeId) {
            TaskAetherStore.shapes = TaskAetherStore.shapes.filter(s => s.id !== selectedShapeId);
            selectedShapeId = null;
        } else if (selectedTextId) {
            TaskAetherStore.textElements = TaskAetherStore.textElements.filter(t => t.id !== selectedTextId);
            selectedTextId = null;
        }
        saveStateToStorage(true);
        renderInbox();
        renderWorkspaceBlocks();
    }

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Delete' || e.key === 'Backspace') {
            if (['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName) || document.activeElement.isContentEditable) return;
            deleteSelectedEntity();
        }
    });

    quickAddCardBtn.addEventListener('click', () => openTaskModal());

    // Initialize & Restore Persistent State
    loadStateFromStorage();
});