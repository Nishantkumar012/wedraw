

const BACKEND = import.meta.env.VITE_BACKEND_URL;

export async function fetchElements(boardId:string){

     const token = localStorage.getItem("token"); // 👈 YAHAN LO

  if (!token) {
    throw new Error("No auth token found");
  }

        //    console.log("token",token);
        
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