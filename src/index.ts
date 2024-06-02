import {
  CRectPlacement,
  CRectPlacementResult,
  TRect,
  URect,
} from "./algorithm.js";

// підключений скріпт lodash через html
declare const _: any;

const BlockPath = new URL("./blocks.json", window.location.href).href;

type BlockCoordinates = {
  top: number;
  left: number;
  right: number;
  bottom: number;
  initialOrder: number;
};

type Block = { width: number; height: number };

type ColorBlock = { color: string } & Block;

//UI відображення прямокутних блоків
class Figure {
  private static colorBool: ColorBlock[] = [];
  private width: number;
  private height: number;

  constructor(private blockCoordinates: BlockCoordinates) {
    this.width = this.blockCoordinates.right - this.blockCoordinates.left;
    this.height = this.blockCoordinates.bottom - this.blockCoordinates.top;
  }

  paint(container__block: HTMLDivElement): void {
    const textHTML: string = `
    <div class="block block__${this.blockCoordinates.initialOrder}">
    <p class="info-item">${this.blockCoordinates.initialOrder}</p>
    </div> \n`;
    container__block.insertAdjacentHTML("beforeend", textHTML);

    const block = container__block.querySelector(
      `.block__${this.blockCoordinates.initialOrder}`
    ) as HTMLDivElement;

    block.style.backgroundColor = this.getRandomHexColor();
    block.style.top = `${this.blockCoordinates.top}px`;
    block.style.left = `${this.blockCoordinates.left}px`;
    block.style.width = `${this.width}px`;
    block.style.height = `${this.height}px`;
  }
  //Отримання кольору
  getRandomHexColor(): string {
    let color = `#${Math.floor(Math.random() * 16777215)
      .toString(16)
      .padStart(6, "0")}`;
    Figure.colorBool.forEach((block) => {
      // умова якщо прямокутники одинакові за площею, колір одинаковий
      if (
        (block.width === this.width && block.height === this.height) ||
        (block.height === this.width && block.width === this.height)
      ) {
        color = block.color;
      } else if (block.color === color) {
        while (block.color === color) {
          if (block.color === color) {
            color = `#${Math.floor(Math.random() * 16777215)
              .toString(16)
              .padStart(6, "0")}`;
          }
        }
      }
    });
    Figure.colorBool.push({
      color,
      width: this.width,
      height: this.height,
    });
    return color;
  }
}

class App {
  public blocks: URect[] = [];
  constructor() {
    this.getBlocks();
  }
  // Отримання параметрів прямокутників з json
  async getBlocks(): Promise<void> {
    try {
      const response = await fetch(BlockPath);
      const blocks: Block[] = await response.json();
      blocks.forEach((block, index) => {
        if (block.width > 0 || block.height > 0)
          this.blocks.push({
            x: 0,
            y: 0,
            width: block.width,
            height: block.height,
            initialOrder: index,
          });
      });
      this.renderBlocks();
    } catch (error) {
      console.error("Помилка при завантаженні файлу:", error);
    }
  }
  // рендер прямокутників
  public renderBlocks(): void {
    const container__block = document.querySelector(
      ".container__block"
    ) as HTMLDivElement;
    container__block.style.width = "100%";
    container__block.style.height = "100vh";
    container__block.style.width = `${window.innerWidth - 50}px`;
    container__block.style.height = `${window.innerHeight - 30}px`;
    const containerSize: TRect = {
      x: 0,
      y: 0,
      width: container__block.clientWidth,
      height: container__block.clientHeight,
    };
    container__block.style.width = `${containerSize.width}px`;
    container__block.style.height = `${containerSize.height}px`;
    container__block.innerHTML = "";
    const rectPlacement = new CRectPlacement();
    const Place: CRectPlacementResult = rectPlacement.calculateRectPlacement(
      this.blocks,
      containerSize
    );
    console.log(Place);

    const fullness = document.querySelector(".fullness") as HTMLElement;
    fullness.textContent = `Fullness: ${Place.fullness}`;

    const container_size_text = document.querySelector(
      ".container__size__text"
    ) as HTMLElement;
    container_size_text.textContent = `Container size: width:${containerSize.width}px; height:${containerSize.height}px`;

    Place.blockCoordinates.forEach((block) => {
      let block_prototype = new Figure(block);
      block_prototype.paint(container__block);
    });
  }
}

const app = new App();

// при зміні розмірів контейнера здійснити перерендер прямокутників
window.addEventListener(
  "resize",
  // підключений скріпт через html
  _.throttle(() => {
    app.renderBlocks();
  }, 300)
);
