

export type ElementType = "RECTANGLE" | "CIRCLE" | "LINE";


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