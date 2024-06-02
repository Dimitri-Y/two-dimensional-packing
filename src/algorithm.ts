import { extractRectangles } from "./extractRectangles.js";

export interface TPos {
  x: number;
  y: number;
}

// Визначення інтерфейсів та типів даних

export interface TRect extends TPos {
  width: number;
  height: number;
  rotated?: boolean; // Додаткове поле для визначення, чи обернутий блок
}

export type URect = TRect & {
  initialOrder: number;
};

export interface CRectPlacementResult {
  fullness: number;
  blockCoordinates: {
    top: number;
    left: number;
    right: number;
    bottom: number;
    initialOrder: number;
  }[];
}

// Клас для розміщення прямокутників в контейнері
export class CRectPlacement {
  // параметри контейнеру
  private container_size: TRect;
  // прямокутники
  private m_vRects: TRect[];
  // площа прямокутників
  private m_area: number;
  // масив прямокутних пустих площин
  private emptyRects: URect[] = [];
  // масив прямокутних внутрішніх порожнин, простору, повністю оточеного блоками (на 100%)
  private filteredEmptyRects: URect[] = [];

  constructor() {
    this.init();
  }

  // Ініціалізація початкових значень
  private init(width: number = 1, height: number = 1): void {
    this.end();
    this.container_size = { x: 0, y: 0, width, height };
    this.m_vRects = [];
    this.m_area = 0;
  }

  // Завершення роботи з прямокутниками
  private end(): void {
    this.m_vRects = [];
    this.container_size = { x: 0, y: 0, width: 0, height: 0 };
  }

  // Обчислення розміщення прямокутників у контейнері
  public calculateRectPlacement(
    rectangles: URect[],
    containerSize: TRect
  ): CRectPlacementResult {
    // Сортування прямокутників за площею у зворотньому порядку
    rectangles.sort((a, b) => {
      const aArea = a.width * a.height;
      const bArea = b.width * b.height;
      return bArea - aArea;
    });

    // Ініціалізація розмірів контейнера та прямокутників
    this.init(containerSize.width, containerSize.height);

    // Масив для зберігання координат розміщення прямокутників
    const blockCoordinates: {
      top: number;
      left: number;
      right: number;
      bottom: number;
      initialOrder: number;
    }[] = [];

    // Розміщення прямокутників у контейнері
    for (let i = 0; i < rectangles.length; i++) {
      const rect = rectangles[i];
      const initialOrder = rect.initialOrder;
      const resultRect: URect = { ...rect, initialOrder };

      // Додавання прямокутника у вільне місце
      if (this.addRectAutoPosition(resultRect)) {
        // Додавання координат розміщення прямокутника
        blockCoordinates.push({
          top: resultRect.y,
          left: resultRect.x,
          right:
            resultRect.x +
            (resultRect.rotated ? resultRect.height : resultRect.width),
          bottom:
            resultRect.y +
            (resultRect.rotated ? resultRect.width : resultRect.height),
          initialOrder: initialOrder,
        });
      } else {
        // Якщо неможливо розмістити прямокутник, повертаємо результат з нульовим заповненням
        return { fullness: 0, blockCoordinates: [] };
      }
    }

    // Знаходження кількості внутрішнього вільного простору
    // Обчислення повноти контейнера

    const initiallyEmptySpace: number = this.findInternalEmptySpace().reduce(
      (previousValue, rect) => {
        return previousValue + rect.width * rect.height;
      },
      0
    );
    const fullness =
      (1 - initiallyEmptySpace / (initiallyEmptySpace + this.m_area)) * 100;
    // Повертаємо результат розміщення прямокутників
    return { fullness, blockCoordinates };
  }

  // Перевірка, чи вільне місце для прямокутника
  private isFree(r: Omit<TRect, "initialOrder">): boolean {
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
  private addRect(r: TRect): void {
    this.m_vRects.push(r);
    this.m_area += r.width * r.height;
  }

  // Пошук вільного місця для прямокутника
  private findEmptySpot(width: number, height: number): TPos | null {
    for (let y = 0; y <= this.container_size.height - height; y++) {
      for (let x = 0; x <= this.container_size.width - width; x++) {
        const rect: Omit<TRect, "initialOrder"> = { x, y, width, height };
        if (this.isFree(rect)) {
          return { x, y };
        }
      }
    }
    return null;
  }

  // Перевірка перетину двох прямокутників
  private intersects(rect1: TRect, rect2: TRect): boolean {
    return (
      rect1.width > 0 &&
      rect1.height > 0 &&
      rect2.width > 0 &&
      rect2.height > 0 &&
      rect2.x + rect2.width > rect1.x &&
      rect2.x < rect1.x + rect1.width &&
      rect2.y + rect2.height > rect1.y &&
      rect2.y < rect1.y + rect1.height
    );
  }

  // Перевірка, чи контейнер містить прямокутник
  private container_sizeContains(rect: TRect): boolean {
    return (
      rect.x >= 0 &&
      rect.y >= 0 &&
      rect.x + rect.width <= this.container_size.width &&
      rect.y + rect.height <= this.container_size.height
    );
  }
  // Перевірка перетину прямокутника з контейнером
  private IsEmptyWithContainer(rect: TRect): boolean {
    return !(
      rect.x != this.container_size.x &&
      rect.y != this.container_size.y &&
      rect.width + rect.x != this.container_size.width &&
      rect.height + rect.y != this.container_size.height
    );
  }
  // Перевірка перетину прямокутників
  private IsEmptyWithRect(rect1: TRect, rect2: TRect): boolean {
    let bool1: boolean = false,
      bool2: boolean = false,
      bool3: boolean = false,
      bool4: boolean = false;
    if (rect1.x + rect1.width === rect2.x) {
      if (
        rect1.y < rect2.y + rect2.height &&
        rect2.y < rect1.height + rect1.y
      ) {
        bool1 = true;
      }
    }
    if (rect2.x + rect2.width === rect1.x) {
      if (
        rect1.y < rect2.y + rect2.height &&
        rect2.y < rect1.height + rect1.y
      ) {
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

  private checkInternalEmptySpace(
    outPutRects: URect[],
    filteredEmptyRects: URect[]
  ): URect[] {
    if (this.filteredEmptyRects.length === 0) {
      return [];
    }
    for (let emptyRect of filteredEmptyRects) {
      // Перевірка чи не перетинається з іншими прямокутниками-пустотами
      for (let otherEmptyRect of outPutRects) {
        if (this.IsEmptyWithRect(emptyRect, otherEmptyRect)) {
          outPutRects.push(emptyRect);
          filteredEmptyRects = this.filteredEmptyRects.filter(
            (rect) => JSON.stringify(emptyRect) != JSON.stringify(rect)
          );
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
  public findInternalEmptySpace(): URect[] {
    const internalEmptySpace: number[][] = Array.from(
      { length: this.container_size.height },
      () => Array(this.container_size.width).fill(1)
    );

    for (const rect of this.m_vRects) {
      for (let y = rect.y; y < rect.y + rect.height; y++) {
        for (let x = rect.x; x < rect.x + rect.width; x++) {
          try {
            internalEmptySpace[y][x] = 0;
          } catch (error) {
            console.log(`неможливо розмістити всі фігури`);
          }
        }
      }
    }
    let rectangles: URect[] = extractRectangles(internalEmptySpace);
    this.emptyRects = rectangles;
    const outPutRects: URect[] = [];
    this.emptyRects.forEach((emptyRect) => {
      // Перевірка чи не перетинається з контейнером
      if (this.IsEmptyWithContainer(emptyRect)) {
        outPutRects.push(emptyRect);
      }
    });
    let filteredEmptyRects: URect[] = [];
    filteredEmptyRects = this.emptyRects.filter((emptyRect) => {
      return outPutRects.every(
        (outputrect) => JSON.stringify(emptyRect) != JSON.stringify(outputrect)
      );
    });

    this.filteredEmptyRects = filteredEmptyRects;
    this.checkInternalEmptySpace(outPutRects, filteredEmptyRects);
    return this.filteredEmptyRects;
  }

  // Додавання прямокутника з автоматичним визначенням позиції
  public addRectAutoPosition(pRect: TRect): boolean {
    if (pRect.width <= 0 || pRect.height <= 0) {
      return true;
    }

    // Пошук вільного місця для прямокутника або його обернутого варіанту
    const emptySpot =
      this.findEmptySpot(pRect.width, pRect.height) ||
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
