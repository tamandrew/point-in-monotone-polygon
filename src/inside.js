
export const preprocess = (points) => {
    let vertices = points.map((p) => {
        return {
            x: p.x,
            y: -p.y,  //invert y since the origin is the top left for html, we want origin at bottom left
            index: p.index
        };
    });

    let ccw = true;
    //if the area is negative, the points are in clockwise order, so reverse them
    if (areaPolygon(vertices) < 0) {
        vertices.reverse();
        ccw = false;
    }
  

    //find left and rightmost vertices
    let min = 0;
    let max = 0;
    for (let i = 1; i < vertices.length; i++)  {
        if (vertices[i].x < vertices[min].x)
            min = i;

        if (vertices[i].x > vertices[max].x)
            max = i;
    }
    
    if (!verifyXMonotone(vertices, min, max)) {
        return [[], [], false];
    }
    //"extract" the top and bottom chains of the polygon in linear time
    let ptr = (min - 1 + vertices.length) % vertices.length; //goes left in the array
    
    let top = [vertices[min]];
    while (ptr !== max) {
        top.push(vertices[ptr]);
        ptr = (ptr - 1 + vertices.length) % vertices.length;
    }
    
    
    ptr = (min + 1) % vertices.length; //goes right in the array
    let bottom = [vertices[min]];
    while (ptr !== max) {
        bottom.push(vertices[ptr]);
        ptr = (ptr + 1) % vertices.length;
    }

    top.push(vertices[max]);
    bottom.push(vertices[max]);

    return [top, bottom, ccw];
}

export const pointInsidePolygon = (top, bottom, point) => {
    //array of steps we follow to the end
    let steps = [];

    //get the min of the x values from the two arrays
    if (top[0].x < bottom[0].x) {
        var lower = top[0].x;
        var lowerIndex = top[0].index
    } else {
        lower = bottom[0].x;
        lowerIndex = bottom[0].index;
    }

    //get the max of the x values
    if (top[top.length - 1].x > bottom[bottom.length - 1].x) {
        var higher = top[top.length - 1].x;
        var higherIndex = top[top.length - 1].index 
    } else  {
        higher = bottom[bottom.length - 1].x;
        higherIndex = bottom[bottom.length - 1].index;
    }

    steps.push({type: "MinMax", min: lowerIndex, max: higherIndex});
    //if left or right of the polygon, return false
    if (point.x < lower) {
        steps.push({type: "Left Min", lower: lowerIndex});
        steps.push({type: "result", result: false});
        return steps;
    }

    if (point.x > higher) {    
        steps.push({type: "Right Max", higher: higherIndex});
        steps.push({type: "result", result: false});
        return steps;
    }


    steps.push({type: "SearchTop"});
    //binary search to find two indices that the point is between
    let min = 0;
    let max = top.length - 1;
    while (min < max) {
        let mid = Math.floor((min + max) / 2);

        steps.push({type: "Binary Search", min: top[min].index, max: top[max].index});

        if (point.x === top[mid].x) {
            min = mid;
            max = mid;
            break;
        }

        if (max - min === 1) {
            break;
        }

        if (top[mid].x < point.x)
            min = mid;
        else
            max = mid;
    }
    steps.push({type: "Between Left", min: top[max].index, max: top[min].index});

    //check with left test
    if (leftOn(top[max], top[min], point)) {
        steps.push({type: "Left On", a: top[max].index, b: top[min].index});
    } else {
        steps.push({type: "Left Not On", a: top[max].index, b: top[min].index});
        steps.push({type: "result", result: false});
        return steps;
    }

    //repeat for right
    steps.push({type: "SearchBottom"});
    min = 0;
    max = bottom.length - 1;
    while (min < max) {
        let mid = Math.floor((min + max) / 2);

        steps.push({type: "Binary Search", min: bottom[min].index, max: bottom[max].index});

        if (point.x === bottom[mid].x) {
            min = mid;
            max = mid;
            break;
        }

        if (max - min === 1) {
            break;
        }

        if (bottom[mid].x < point.x)
            min = mid;
        else
            max = mid;
    }
    steps.push({type: "Between Right", min: bottom[max].index, max: bottom[min].index});

    
    if (leftOn(bottom[min], bottom[max], point)) {
        steps.push({type: "Left On", a: bottom[min].index, b: bottom[max].index});
    } else {
        steps.push({type: "Left Not On", a: bottom[min].index, b: bottom[max].index});
        steps.push({type: "result", result: false});
        return steps;
    }


    //done
    steps.push({type: "result", result: true});
    return steps;
}

const verifyXMonotone = (vertices, min, max) => {
    //between max to min is the top chain, verify that the x coordinates are decreasing
    for (let i = max; i !== min; i = (i + 1) % vertices.length) {
        if (vertices[i].x < vertices[(i + 1) % vertices.length].x) {
            return false;
        }
    }

    //between min to max is the bottom chain, verify that the x coordinates are increasing
    for (let i = min; i !== max; i = (i + 1) % vertices.length) {
        if (vertices[i].x > vertices[(i + 1) % vertices.length].x) {
            return false;
        }
    }

    return true;
}




//below are the predicates from slides
const area2 = (a, b, c) => {   
    return (b.x - a.x) * (c.y - a.y) - (c.x - a.x) * (b.y - a.y) ;
}

const leftOn = (a, b, c) => {
    return area2(a, b, c) >= 0;
}

const areaPolygon = (vertices) => {
    //using an array instead of a linked list like structure on the slides, so we need a ptr
    let ptr = 0;
    let sum = 0;
    do {
        let nextPtr = (ptr + 1) % vertices.length;

        sum += area2(vertices[0], vertices[ptr], vertices[nextPtr]);

        ptr = nextPtr;

    } while (ptr % vertices.length !== 0)

    return sum;
}