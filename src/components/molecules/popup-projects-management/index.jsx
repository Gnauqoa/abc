import React, { useEffect, useRef, useState } from "react";
import { Navbar, Button, Page, Popup } from "framework7-react";
import { searchProjects, openProject, removeProject } from "../../../utils/cordova-file-utils";
import "./index.scss";
import { PROJECT_FOLDER } from "../../../js/constants";
import { useTranslation } from "react-i18next";

const ProjectManagementPopup = ({ f7router, opened, onClose }) => {
  const { t, i18n } = useTranslation();

  const dataRunManagementPopupRef = useRef();
  const [projects, setProjects] = useState([]);

  async function onDeleteProjects(project) {
    const filePath = PROJECT_FOLDER + "/" + project.name;
    const result = await removeProject(filePath);
    if (result) setProjects(projects.filter((p) => p.name !== project.name));
    console.log("DELETE_PROJECT: ", JSON.stringify(project), JSON.stringify(result));
  }

  async function onChooseProject(project) {
    const filePath = PROJECT_FOLDER + "/" + project.name;
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
        <Navbar className="project-management-header" title={t("modules.project_management")}></Navbar>
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
