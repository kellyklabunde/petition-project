const canvas = document.querySelector("canvas");
const input = document.querySelector("input[name=signature]");

const ctx = canvas.getContext("2d");

if (canvas) {
    console.log(canvas);
    ctx.strokeStyle = "black";
    let isDrawing = false;

    canvas.addEventListener("mousedown", function (event) {
        console.log("mousedown");
        ctx.beginPath();
        ctx.moveTo(event.layerX, event.layerY);
        isDrawing = true;
    });

    canvas.addEventListener("mousemove", function (event) {
        console.log(isDrawing);
        if (isDrawing) {
            console.log(event.layerX, event.layerY);
            ctx.lineTo(event.layerX, event.layerY);
            ctx.stroke();
        }
    });

    canvas.addEventListener("mouseup", function () {
        console.log("mouse up");
        isDrawing = false;

        input.value = canvas.toDataURL("image/png");
    });
}
