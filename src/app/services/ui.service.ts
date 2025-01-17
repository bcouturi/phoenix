import {Injectable} from '@angular/core';
import * as Stats from 'stats-js';
import * as dat from 'dat.gui';
import {ThreeService} from './three.service';
import {Configuration} from './loaders/configuration.model';
import {PresetView} from './extras/preset-view.model';
import {Cut} from './extras/cut.model';

@Injectable({
  providedIn: 'root'
})
export class UIService {
  private stats;
  private gui;
  private guiParameters = {
    rotate: undefined,
    axis: undefined,
    xClipPosition: undefined,
    yClipPosition: undefined,
    zClipPosition: undefined,
    lowRes: undefined,
    eventData: undefined
  };
  private geomFolder: any;
  private controlsFolder: any;
  private eventFolder: any;
  private viewFolder: any;
  private configuration: Configuration;
  private canvas: HTMLElement;

  constructor(private three: ThreeService) {
  }

  public showUI(configuration: Configuration) {
    // Shows a panel on screen with information about the performance (fps).
    this.showStats();
    // Shows the menu that contains the options to interact with the scene.
    this.showMenu(configuration);
  }

  private showStats() {
    this.stats = Stats();
    this.stats.showPanel(0);
    this.stats.dom.className = 'ui-element';
    this.stats.domElement.style.cssText = 'position: absolute; left: 0px; cursor: pointer; opacity: 0.9; z-index: 10; bottom: 0px;';
    let canvas = document.getElementById('eventDisplay');
    if (canvas == null) {
      canvas = document.body;
    }
    canvas.appendChild(this.stats.dom);
  }

  public updateUI() {
    this.stats.update();
  }

  private showMenu(configuration: Configuration) {
    this.configuration = configuration;
    this.gui = new dat.GUI();
    this.gui.domElement.id = 'gui';
    this.canvas = document.getElementById('eventDisplay');
    if (this.canvas == null) {
      this.canvas = document.body;
    }
    this.canvas.appendChild(this.gui.domElement);
    this.controlsFolder = this.gui.addFolder('Controls');
    this.geomFolder = null;
    this.eventFolder = null;

    this.addToggle(this.controlsFolder, 'rotate', 'Auto Rotate?', false, (value) => this.three.autoRotate(value));
    this.addToggle(this.controlsFolder, 'axis', 'Axis', true, (value) => this.three.setAxis(value));
    this.addToggle(this.controlsFolder, 'lowRes', 'Low Resolution', false, (value) => this.three.lowerResolution(value));
    this.addToggle(this.controlsFolder, 'darkBg', 'Dark Background', configuration.darkBackground,
      (value) => this.three.darkBackground(value));
    this.addToggle(this.controlsFolder, 'clipping', 'Enable Clipping', false, (value) => this.three.setClipping(value));

    this.controlsFolder.add(this.three.getXClipPlane(), 'constant', -configuration.xClipPosition, configuration.xClipPosition)
      .name('xClipPosition');
    this.controlsFolder.add(this.three.getYClipPlane(), 'constant', -configuration.yClipPosition, configuration.yClipPosition)
      .name('yClipPosition');
    this.controlsFolder.add(this.three.getZClipPlane(), 'constant', -configuration.zClipPosition, configuration.zClipPosition)
      .name('zClipPosition');

    // View parameters
    this.displayViews(configuration);
  }

  private displayViews(configuration: Configuration) {
    this.viewFolder = this.gui.addFolder('Views');
    this.addToggle(this.viewFolder, 'useOrtho', 'Orthographic View', false, (value) => this.three.swapCameras(value));
    this.setOverlayButtons();
    this.addButton(this.viewFolder, 'Align X', () => this.three.alignCameraWithAxis('X'));
    this.addButton(this.viewFolder, 'Align Y', () => this.three.alignCameraWithAxis('Y'));
    this.addButton(this.viewFolder, 'Align Z', () => this.three.alignCameraWithAxis('Z'));

    if (configuration.anyPresetView()) {
      this.displayPresetViews(configuration.presetViews);
    }
  }

  private setOverlayButtons() {
    this.addToggle(this.viewFolder, 'Overlay', 'Overlay', true, (value) => this.three.renderOverlay(value));
    this.addToggle(this.viewFolder, 'setFixOverlay', 'Fix Overlay', false, (value) => this.three.fixOverlayView(value));

    /*const element = document.getElementById('optionsPanel');
    if (element) {
      const overlayButton = document.createElement('img');
      overlayButton.setAttribute('src', view.getIconURL());
      overlayButton.addEventListener('click', this.three.setCameraPos(view.cameraPos));
      element.append(overlayButton);
    }*/
  }


  private displayPresetViews(presetViews: PresetView[]) {
    const presetViewFolder = this.viewFolder.addFolder('Preset Views');
    const presetIconsUl = document.createElement('div');
    presetIconsUl.className = 'preset-views';

    const scope = this;
    presetViews.forEach((view) => {
      // Animation
      const animationFunction = () => {
        scope.three.animateCameraTransform(view.cameraPos, [0, 0, 0], 1000);
      };
      // For menu
      view.setView = animationFunction;
      presetViewFolder.add(view, 'setView').name(view.name);
      // For icons
      const svgElement = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svgElement.classList.add('optionsButton');
      svgElement.addEventListener('click', animationFunction);
      const useElement = document.createElementNS('http://www.w3.org/2000/svg', 'use');
      useElement.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', view.getIconURL());
      svgElement.append(useElement);
      presetIconsUl.append(svgElement);
    });
    const element = document.getElementById('optionsPanel');
    if (element) {
      element.appendChild(presetIconsUl);
    } else {
      this.canvas.append(presetIconsUl);
    }
  }

  /**
   * Adds a boolean toggle to the any level of a GUI.
   * @param guiLevel Name of the folder that you want to apppend to.
   * @param fieldName Name of the field that will be changed.
   * @param tag Name that will be shown next to the toggle.
   * @param defaultValue initial value that will be set.
   * @param onChange function that will be executed when the toggle is pressed.
   * @returns Reference to the created object.
   */
  private addToggle(guiLevel: any, fieldName: string, tag: string, defaultValue: boolean, onChange: (value: boolean) => any): any {
    this.guiParameters[fieldName] = defaultValue;
    const menu = guiLevel.add(this.guiParameters, fieldName).name(tag);
    menu.onChange(onChange);
    onChange(defaultValue);

    return menu;
  }

  /**
   * Adds a button to any level of a GUI.
   * @param guiLevel Parent GUI level, where a button wuill be inserted.
   * @param name Name that will be shown on a button.
   * @param onClick Function that will be called once the button is pressed.
   * @returns Reference to the created object.
   */
  private addButton(guiLevel: any, name: string, onClick: () => any): any {
    const buttonObject = {};
    buttonObject[name] = onClick;

    const button = guiLevel.add(buttonObject, name);
    return button;
  }

  public clearUI() {
    const gui = document.getElementById('gui');
    if (gui != null) {
      gui.remove();
    }
    this.geomFolder = null;
  }

  public addGeometry(name: string, colour) {
    if (this.geomFolder == null) {
      this.geomFolder = this.gui.addFolder('Geometry');
    }
    // A new folder for the object is added to the 'Geometry' folder
    this.guiParameters[name] = {show: true, color: colour, x: 0, y: 0, z: 0, remove: this.removeOBJ(name), scale: 1};
    const objFolder = this.geomFolder.addFolder(name);
    // A color picker is added to the object's folder
    const colorMenu = objFolder.addColor(this.guiParameters[name], 'color').name('Color');
    colorMenu.onChange((value) => this.three.objColor(name, value));
    // A boolean toggle for showing/hiding the object is added to its folder
    const showMenu = objFolder.add(this.guiParameters[name], 'show').name('Show').listen();
    showMenu.onChange((value) => this.three.objectVisibility(name, value));
    // Scale slider
    const scaleMenu = objFolder.add(this.guiParameters[name], 'scale', 0, 1000).name('Scale');
    scaleMenu.onChange((value) => {
      this.three.scaleObject(name, value);
    });
    // Controls for positioning.
    // const position = this.three.getObjectPosition(name);
    objFolder.add(this.guiParameters[name], 'x', -this.configuration.maxPositionX, this.configuration.maxPositionX)
      .name('X').onChange((value) => this.three.getObjectPosition(name).setX(value));
    objFolder.add(this.guiParameters[name], 'y', -this.configuration.maxPositionY, this.configuration.maxPositionY)
      .name('Y').onChange((value) => this.three.getObjectPosition(name).setY(value));
    objFolder.add(this.guiParameters[name], 'z', -this.configuration.maxPositionZ, this.configuration.maxPositionZ)
      .name('Z').onChange((value) => this.three.getObjectPosition(name).setZ(value));
    // Controls for deleting the obj
    objFolder.add(this.guiParameters[name], 'remove').name('Remove');
  }

  private removeOBJ(name: string) {
    return () => {
      const folder = this.geomFolder.__folders[name];
      if (folder) {
        this.geomFolder.removeFolder(folder);
      }
      this.three.removeObject(name);
    };
  }

  /**
   * Functions for event data toggles.
   */
  public addEventDataFolder() {
    // If there is already an event data folder it is deleted and creates a new one.
    if (this.eventFolder != null) {
      this.gui.removeFolder(this.eventFolder);
    }
    // A new folder for the Event Data is added to the GUI.
    this.eventFolder = this.gui.addFolder('Event Data');
    this.guiParameters.eventData = {show: true};
    // A boolean toggle for showing/hiding the event data is added to the 'Event Data' folder.
    const menu = this.eventFolder.add(this.guiParameters.eventData, 'show').name('Show').listen();
    menu.onChange((value) => this.three.objectVisibility('EventData', value));
  }

  public addEventDataTypeFolder(objectType: string) {
    const typeFolder = this.eventFolder.addFolder(objectType);
    this.guiParameters.eventData[objectType] = true;
    const menu = typeFolder.add(this.guiParameters.eventData, objectType).name('Show').listen();
    menu.onChange((value) => this.three.objectVisibility(objectType, value));
    return typeFolder;
  }

  public addCollection(typeFolder: any, collectionName: string, cuts?: Cut[]) {
    // A new folder for the collection is added to the 'Event Data' folder
    this.guiParameters[collectionName] = {show: true, color: 0x000000, resetCut: () => this.three.groupVisibility(collectionName, true)};
    const collFolder = typeFolder.addFolder(collectionName);
    // A boolean toggle for showing/hiding the collection is added to its folder
    const showMenu = collFolder.add(this.guiParameters[collectionName], 'show').name('Show').listen();
    showMenu.onChange((value) => this.three.objectVisibility(collectionName, value));
    // A color picker is added to the collection's folder
    const colorMenu = collFolder.addColor(this.guiParameters[collectionName], 'color').name('Color');
    colorMenu.onChange((value) => this.three.collectionColor(collectionName, value));
    // Cuts menu
    if (cuts) {
      const cutsFolder = collFolder.addFolder('Cuts');
      cutsFolder.add(this.guiParameters[collectionName], 'resetCut').name('Reset cuts');
      for (const cut of cuts) {
        const minCut = cutsFolder.add(cut, 'minValue', cut.minValue, cut.maxValue).name('min ' + cut.field);
        minCut.onChange((value) => {
          this.three.collectionFilter(collectionName, cut);
        });
        const maxCut = cutsFolder.add(cut, 'maxValue', cut.minValue, cut.maxValue).name('max ' + cut.field);
        maxCut.onChange((value) => {
          this.three.collectionFilter(collectionName, cut);
        });
      }
    }

  }


}
