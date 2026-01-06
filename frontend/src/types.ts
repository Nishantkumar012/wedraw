

export type ElementType = "RECTANGLE" | "CIRCLE" | "LINE" | "PENCIL";


export type Point = { x: number, y: number};

export type PencilStroke = {
       id: string;
       type: "PENCIL";
       points: Point[];
}


export interface BoardElement{
       id: string,
       boardId:string;
       type: ElementType,
       data:{
        x: number,
        y:number,
        width:number,
        height:number,
        color?:string
       }
      
}