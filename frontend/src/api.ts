

const BACKEND = import.meta.env.VITE_BACKEND_URL;

export async function fetchElements(boardId:string,token:string){

           console.log("token",token);
        
       const res = await fetch(`${BACKEND}/boards/${boardId}/elements`,{
            method: "GET",
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