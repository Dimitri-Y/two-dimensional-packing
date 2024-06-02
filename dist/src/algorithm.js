import { extractRectangles } from "./extractRectangles.js";
// Клас для розміщення прямокутників в контейнері
export class CRectPlacement {
    constructor() {
        // масив прямокутних пустих площин
        this.emptyRects = [];
        // масив прямокутних внутрішніх порожнин, простору, повністю оточеного блоками (на 100%)
        this.filteredEmptyRects = [];
        this.init();
    }
    // Ініціалізація початкових значень
    init(width = 1, height = 1) {
        this.end();
        this.container_size = { x: 0, y: 0, width, height };
        this.m_vRects = [];
        this.m_area = 0;
    }
    // Завершення роботи з прямокутниками
    end() {
        this.m_vRects = [];
        this.container_size = { x: 0, y: 0, width: 0, height: 0 };
    }
    // Обчислення розміщення прямокутників у контейнері
    calculateRectPlacement(rectangles, containerSize) {
        // Сортування прямокутників за площею у зворотньому порядку
        rectangles.sort((a, b) => {
            const aArea = a.width * a.height;
            const bArea = b.width * b.height;
            return bArea - aArea;
        });
        // Ініціалізація розмірів контейнера та прямокутників
        this.init(containerSize.width, containerSize.height);
        // Масив для зберігання координат розміщення прямокутників
        const blockCoordinates = [];
        // Розміщення прямокутників у контейнері
        for (let i = 0; i < rectangles.length; i++) {
            const rect = rectangles[i];
            const initialOrder = rect.initialOrder;
            const resultRect = { ...rect, initialOrder };
            // Додавання прямокутника у вільне місце
            if (this.addRectAutoPosition(resultRect)) {
                // Додавання координат розміщення прямокутника
                blockCoordinates.push({
                    top: resultRect.y,
                    left: resultRect.x,
                    right: resultRect.x +
                        (resultRect.rotated ? resultRect.height : resultRect.width),
                    bottom: resultRect.y +
                        (resultRect.rotated ? resultRect.width : resultRect.height),
                    initialOrder: initialOrder,
                });
            }
            else {
                // Якщо неможливо розмістити прямокутник, повертаємо результат з нульовим заповненням
                return { fullness: 0, blockCoordinates: [] };
            }
        }
        // Знаходження кількості внутрішнього вільного простору
        // Обчислення повноти контейнера
        const initiallyEmptySpace = this.findInternalEmptySpace().reduce((previousValue, rect) => {
            return previousValue + rect.width * rect.height;
        }, 0);
        const fullness = (1 - initiallyEmptySpace / (initiallyEmptySpace + this.m_area)) * 100;
        // Повертаємо результат розміщення прямокутників
        return { fullness, blockCoordinates };
    }
    // Перевірка, чи вільне місце для прямокутника
    isFree(r) {
        if (!this.container_sizeContains(r)) {
            return false;
        }
        for (const rect of this.m_vRects) {
            if (this.intersects(rect, r)) {
                return false;
            }
        }
        return true;
    }
    // Додавання прямокутника та оновлення площі
    addRect(r) {
        this.m_vRects.push(r);
        this.m_area += r.width * r.height;
    }
    // Пошук вільного місця для прямокутника
    findEmptySpot(width, height) {
        for (let y = 0; y <= this.container_size.height - height; y++) {
            for (let x = 0; x <= this.container_size.width - width; x++) {
                const rect = { x, y, width, height };
                if (this.isFree(rect)) {
                    return { x, y };
                }
            }
        }
        return null;
    }
    // Перевірка перетину двох прямокутників
    intersects(rect1, rect2) {
        return (rect1.width > 0 &&
            rect1.height > 0 &&
            rect2.width > 0 &&
            rect2.height > 0 &&
            rect2.x + rect2.width > rect1.x &&
            rect2.x < rect1.x + rect1.width &&
            rect2.y + rect2.height > rect1.y &&
            rect2.y < rect1.y + rect1.height);
    }
    // Перевірка, чи контейнер містить прямокутник
    container_sizeContains(rect) {
        return (rect.x >= 0 &&
            rect.y >= 0 &&
            rect.x + rect.width <= this.container_size.width &&
            rect.y + rect.height <= this.container_size.height);
    }
    // Перевірка перетину прямокутника з контейнером
    IsEmptyWithContainer(rect) {
        return !(rect.x != this.container_size.x &&
            rect.y != this.container_size.y &&
            rect.width + rect.x != this.container_size.width &&
            rect.height + rect.y != this.container_size.height);
    }
    // Перевірка перетину прямокутників
    IsEmptyWithRect(rect1, rect2) {
        let bool1 = false, bool2 = false, bool3 = false, bool4 = false;
        if (rect1.x + rect1.width === rect2.x) {
            if (rect1.y < rect2.y + rect2.height &&
                rect2.y < rect1.height + rect1.y) {
                bool1 = true;
            }
        }
        if (rect2.x + rect2.width === rect1.x) {
            if (rect1.y < rect2.y + rect2.height &&
                rect2.y < rect1.height + rect1.y) {
                bool2 = true;
            }
        }
        if (rect1.y + rect1.height === rect2.y) {
            if (rect1.x < rect2.x + rect2.width && rect2.x < rect1.x + rect1.width) {
                bool3 = true;
            }
        }
        if (rect2.y + rect2.height === rect1.y) {
            if (rect1.x < rect2.x + rect2.width && rect2.x < rect1.x + rect1.width) {
                bool4 = true;
            }
        }
        return bool1 || bool2 || bool3 || bool4;
    }
    checkInternalEmptySpace(outPutRects, filteredEmptyRects) {
        if (this.filteredEmptyRects.length === 0) {
            return [];
        }
        for (let emptyRect of filteredEmptyRects) {
            // Перевірка чи не перетинається з іншими прямокутниками-пустотами
            for (let otherEmptyRect of outPutRects) {
                if (this.IsEmptyWithRect(emptyRect, otherEmptyRect)) {
                    outPutRects.push(emptyRect);
                    filteredEmptyRects = this.filteredEmptyRects.filter((rect) => JSON.stringify(emptyRect) != JSON.stringify(rect));
                    this.filteredEmptyRects = filteredEmptyRects;
                    if (this.filteredEmptyRects.length === 0) {
                        return this.filteredEmptyRects;
                    }
                    this.checkInternalEmptySpace(outPutRects, filteredEmptyRects);
                }
            }
        }
        return filteredEmptyRects;
    }
    // Знаходження кількості внутрішнього вільного простору
    findInternalEmptySpace() {
        const internalEmptySpace = Array.from({ length: this.container_size.height }, () => Array(this.container_size.width).fill(1));
        for (const rect of this.m_vRects) {
            for (let y = rect.y; y < rect.y + rect.height; y++) {
                for (let x = rect.x; x < rect.x + rect.width; x++) {
                    try {
                        internalEmptySpace[y][x] = 0;
                    }
                    catch (error) {
                        console.log(`неможливо розмістити всі фігури`);
                    }
                }
            }
        }
        let rectangles = extractRectangles(internalEmptySpace);
        this.emptyRects = rectangles;
        const outPutRects = [];
        this.emptyRects.forEach((emptyRect) => {
            // Перевірка чи не перетинається з контейнером
            if (this.IsEmptyWithContainer(emptyRect)) {
                outPutRects.push(emptyRect);
            }
        });
        let filteredEmptyRects = [];
        filteredEmptyRects = this.emptyRects.filter((emptyRect) => {
            return outPutRects.every((outputrect) => JSON.stringify(emptyRect) != JSON.stringify(outputrect));
        });
        this.filteredEmptyRects = filteredEmptyRects;
        this.checkInternalEmptySpace(outPutRects, filteredEmptyRects);
        return this.filteredEmptyRects;
    }
    // Додавання прямокутника з автоматичним визначенням позиції
    addRectAutoPosition(pRect) {
        if (pRect.width <= 0 || pRect.height <= 0) {
            return true;
        }
        // Пошук вільного місця для прямокутника або його обернутого варіанту
        const emptySpot = this.findEmptySpot(pRect.width, pRect.height) ||
            this.findEmptySpot(pRect.height, pRect.width);
        if (emptySpot) {
            pRect.x = emptySpot.x;
            pRect.y = emptySpot.y;
            this.addRect(pRect);
            return true;
        }
        return false;
    }
}
//# sourceMappingURL=algorithm.js.map