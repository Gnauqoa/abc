import React, { useEffect, useRef, useState } from "react";
import { Navbar, Button, Page, Popup } from "framework7-react";
import { searchProjects, openProject, removeProject } from "../../../utils/cordova-file-utils";
import "./index.scss";

const ProjectManagementPopup = ({ f7router, opened, onClose }) => {
  const dataRunManagementPopupRef = useRef();
  const [projects, setProjects] = useState([]);

  async function onDeleteProjects(project) {
    const result = await removeProject(project.path);
    if (result) setProjects(projects.filter((p) => p.path !== project.path || p.name !== project.name));
    console.log("DELETE_PROJECT: ", JSON.stringify(project), JSON.stringify(result));
  }

  async function onChooseProject(project) {
    const { path: filePath } = project;
    const fileContent = await openProject(filePath);
    const content = JSON.parse(fileContent);

    onClose();
    f7router.navigate("/edl", {
      props: {
        filePath: filePath,
        content,
      },
    });
  }

  useEffect(() => {
    async function loadProjects() {
      try {
        const files = await searchProjects();
        setProjects(files);
      } catch (error) {}
    }

    if (opened) loadProjects();
  }, [opened]);

  return (
    <Popup className="project-management-popup" ref={dataRunManagementPopupRef} opened={opened} onPopupClose={onClose}>
      <Page className="project-management">
        <Navbar className="project-management-header" title="Quản lý Projects"></Navbar>
        <div className="list-project">
          {projects.map((project) => (
            <div className="list-item" key={project.name}>
              <span className="project-name" onClick={() => onChooseProject(project)}>
                {project.name}
              </span>
              <Button
                className="list-button"
                iconIos={"material:delete"}
                iconMd={"material:delete"}
                iconAurora={"material:delete"}
                iconSize={35}
                iconColor="gray"
                onClick={() => onDeleteProjects(project)}
              ></Button>
            </div>
          ))}
        </div>
      </Page>
    </Popup>
  );
};

export default ProjectManagementPopup;
