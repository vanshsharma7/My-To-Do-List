import React, { useEffect, useState } from "react";
import NoteCard from "../../components/Cards/NoteCard";
import Navbar from "../../components/Navbar/Navbar";
import { MdAdd } from "react-icons/md";
import AddEditNotes from "./AddEditNotes";
import Modal from "react-modal";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../../utils/axiosInstance";
import ToastMessage from "../../components/ToastMessage/ToastMessage";
import EmptyCard from "../../components/EmptyCard/EmptyCard";
import AddNotesImg from "../../assets/images/empty-note.png";

const Home = () => {
    const [openAddEditModal, setOpenAddEditModal] = useState({
        isShown: false,
        type: "add",
        data: null
    });

    const [showtstmsg, setshowtstmsg] = useState({
        isShown: false,
        message: "",
        type: "add"
    })
    const [userInfo, setUserInfo] = useState(null);
    const [allNotes, setAllNotes] = useState([]);

    const navigate = useNavigate();

    const handleEdit = (noteDetails)=>{
        setOpenAddEditModal({isShown: true, data: noteDetails, type: "edit"});
    };

    const showToastMessage = (message, type)=>{
        setshowtstmsg({
            isShown: true,
            message,
            type
        });
    };

    const handleCloseToast = ()=>{
        setshowtstmsg({
            isShown: false,
            message: ""
        });
    };
    
    const getUserInfo = async () => {
        try{
            const response = await axiosInstance.get("/get-user");
            if(response.data && response.data.user){
                setUserInfo(response.data.user);
            }
        } 
        catch(error){
            if(error.response.status === 401){
                localStorage.clear();
                navigate("/login");
            }
        }
    };

    const getAllNotes = async () => {
        try {
            const response = await axiosInstance.get("/get-all-to-do");
            if (response.data && response.data.notes) {
                console.log("Notes fetched:", response.data.notes); // Debug log
                setAllNotes(response.data.notes);
            }
        } catch (error) {
            console.error("Error fetching notes:", error);
        }
    };

    const deleteNote = async(data)=>{
        const noteId = data._id;
        try{
            const response = await axiosInstance.delete("/delete-a-to-do/"+noteId);
            if(response.data && !response.data.error){
                showToastMessage("Note Deleted Successfully",'delete');
                getAllNotes();
            }
        }
        catch(error){
            if(error.response && error.response.data && error.response.data.message){
                console.log("An unexpected error has occured. Please try again.");
            }
        }
    }

    // const updateIsPinned = async(noteData)=>{
    //     const noteID = noteData._id;
    //     const newPinnedState = !noteData.isPinned;
    //     try{
    //         const response = await axiosInstance.put("/pin-a-to-do/"+noteID,{
    //             isPinned: newPinnedState
    //         });
    //         if(response.data && response.data.note){
    //             showToastMessage(noteData.isPinned ? "Note Unpinned Successfully" : "Note Pinned Successfully","update");
    //             getAllNotes();
    //         }
    //     }
    //     catch(error){
    //         console.log(error); 
    //     }
    // }

    useEffect(()=>{
        getAllNotes();
        getUserInfo();
        return ()=>{};
    },[]);

    return (
        <>
            <Navbar userInfo={userInfo}/>
            <div className="container mx-auto px-8">
                {allNotes.length>0?(
                <div className="grid grid-cols-3 gap-4 mt-8">
                    {allNotes.map((item,index)=>(
                        <NoteCard
                            key={item._id}
                            title={item.title}
                            date={item.createdOn}
                            content={item.content}
                            tags={item.tags}
                            isPinned={item.isPinned}
                            onEdit={() => handleEdit(item)}
                            onDelete={() => deleteNote(item)}
                            onPinNote={() => {}}
                        />
                    ))}
                </div>
                ):(
                    <EmptyCard imgSrc={AddNotesImg} message={`Start creating your first note! Click the 'Add' button to jot down your thoughts, ideas, tasks, reminders. Let's get started!`}/>
                )
                }
            </div>
            <button className="w-16 h-16 flex items-center justify-center rounded-2xl bg-primary hover:bg-blue-600 absolute right-10 bottom-10"
                onClick={() => {
                    setOpenAddEditModal({ isShown: true, type: "add", data: null });
                }}
            >
                <MdAdd className="text-[32px] text-white" />
            </button>
            <Modal
                isOpen={openAddEditModal.isShown}
                onRequestClose={() => {}}
                style={{
                    overlay: {
                        backgroundColor: "rgba(0,0,0,0.2)"
                    },
                }}
                contentLabels=""
                className="w-[40%] max-h-3/4 bg-white rounded-md mx-auto mt-14 p-5 "
            >
                <AddEditNotes 
                type={openAddEditModal.type}
                noteData={openAddEditModal.data}
                onClose={()=>{
                    setOpenAddEditModal({isShown:false, type:"add", data:null})
                }}
                getAllNotes={getAllNotes}
                showToastMessage={showToastMessage}
                />
            </Modal>
            <ToastMessage
                isShown={showtstmsg.isShown}
                message={showtstmsg.message}
                type={showtstmsg.type}
                onClose={handleCloseToast}
            />
        </>
    );
};

export default Home;