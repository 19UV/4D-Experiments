# 4D Experiments
This is a series of experiments in visualizing 4D spaces. The engine (if it can be called that) is written in Typescript, on top of ThreeJS, and is bundled via Webpack.

## How It Works
All objects are defined as an array of tetrahedra and verticies. The verticies are defined in 4D space (but also contain color and eventually normals). A function then goes through the defined tetrahedra and find all the cross sections (4D -> 3D), and puts the triangles/quads into a BufferGeometry which is rendererd.

Here is a code example of the cross section algorithm (TypeScript):

```typescript
const w_level: number = 0;

/* ... */

const edges: number[] = [0, 1, 0, 2, 0, 3, 1, 2, 2, 3, 1, 3];
this.tets.forEach((t: number[]) => {
    let pts: Array<number[]> = [];
    for(let i: number = 0; i < 12; i += 2) {
        const A: number[] = this.verts[ t[ edges[  i  ] ] ];
        const B: number[] = this.verts[ t[ edges[ i+1 ] ] ];

        const A_w: number = A[3];
        const B_w: number = B[3];

        if(A_w == B_w) continue; // Verticies (A and B) are parallel with intersection plane
        if(w_level < Math.min(A_w, B_w)) continue; // 'Plane' is below lowest point (doesn't collide)
        if(w_level > Math.max(A_w, B_w)) continue; // 'Plane' is above highest point (doesn't collide)

        const n: number = 1 / (B_w - A_w);
        const inter: number = n * (w_level - A_w); // Value from 0 to 1 where 'plane' collides with line
        pts.push(Lerp(A, B, inter));
    }

    switch(pts.length) {
        case 0: break; // No collision points
        case 3:
            // Add TRIANGLE to buffer
            break;
        case 4:
            // Add QUAD to buffer (note: this may actually be a tetrahedra; need to add more points)
            break;
        default:
            // Doesn't need graceful error handling, this *should* never happen
            break;
    }
});
```