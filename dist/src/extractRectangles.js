/* Функція знаходження многокутного простору, не зайнятого прямокутниками
 та повернення масиву пустих прямокутників з цього многокутника*/
export function extractRectangles(sourceMap) {
    let rects = [];
    const filled = 8;
    const lenY = sourceMap.length;
    const lenX = sourceMap[0].length;
    for (let y = 0; y < lenY; y++) {
        for (let x = 0; x < lenX; x++) {
            if (sourceMap[y][x] === 1) {
                sourceMap[y][x] = filled;
                let startY = y;
                let startX = x;
                let endY = startY;
                let endX = startX;
                // перевірка  в ширину
                while (endX + 1 < lenX) {
                    if (sourceMap[startY][endX + 1] === 1) {
                        sourceMap[startY][endX + 1] = filled;
                        endX++;
                    }
                    else
                        break;
                }
                // перевірка в висоту вниз
                while (endY + 1 < lenY) {
                    let canDown = true;
                    for (let xx = startX; xx <= endX; xx++) {
                        if (sourceMap[endY + 1][xx] != 1) {
                            canDown = false;
                        }
                    }
                    if (canDown) {
                        for (let xx = startX; xx <= endX; xx++) {
                            sourceMap[endY + 1][xx] = filled;
                        }
                        endY++;
                    }
                    else
                        break;
                }
                rects.push({
                    x: startX,
                    y: startY,
                    width: endX - startX + 1,
                    height: endY - startY + 1,
                    initialOrder: rects.length,
                });
            }
        }
    }
    return rects;
}
//# sourceMappingURL=extractRectangles.js.map