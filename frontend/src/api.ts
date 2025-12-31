

export async function fetchElements(boardId:string,token:string){
        
       const res = await fetch(`http://localhost:3000/boards/${boardId}/elements`,{
            headers: {
                Authorization : `Bearer ${token}`,
            }
       });
        //    console.log("the res come fron fetch elemnts",res);
         if(!res.ok){
             throw new Error("failed to fetch elements");
         }

         return res.json();
}