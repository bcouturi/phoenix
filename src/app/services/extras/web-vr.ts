export class WebVR {
  /**
   * @author mrdoob / http://mrdoob.com
   * @author Mugen87 / https://github.com/Mugen87
   *
   * Based on @tojiro's vr-samples-utils.js
   */

  public createButton(renderer, options) {
    let button;

    if (options && options.frameOfReferenceType) {
      renderer.vr.setFrameOfReferenceType(options.frameOfReferenceType);
    }

    function showEnterVR(device) {

      button.style.display = '';

      button.style.cursor = 'pointer';
      button.style.left = 'calc(50% - 50px)';
      button.style.width = '100px';
      button.style.bottom = '6rem';

      button.textContent = 'ENTER VR';

      button.onmouseenter = () => {
        button.style.opacity = '1.0';
      };
      button.onmouseleave = () => {
        button.style.opacity = '0.5';
      };

      button.onclick = () => {
        device.isPresenting ? device.exitPresent() : device.requestPresent([{source: renderer.domElement}]);
      };

      renderer.vr.setDevice(device);

    }

    function showEnterXR(device) {
      let currentSession = null;

      function onSessionStarted(session) {

        session.addEventListener('end', onSessionEnded);

        renderer.vr.setSession(session);
        button.textContent = 'EXIT VR';

        currentSession = session;
      }

      function onSessionEnded(event) {
        currentSession.removeEventListener('end', onSessionEnded);

        renderer.vr.setSession(null);
        button.textContent = 'ENTER VR';

        currentSession = null;
      }

      button.style.display = '';

      button.style.cursor = 'pointer';
      button.style.left = 'calc(50% - 50px)';
      button.style.width = '100px';
      button.style.bottom = '6rem';
      button.textContent = 'ENTER VR';

      button.onmouseenter = () => {
        button.style.opacity = '1.0';
      };
      button.onmouseleave = () => {
        button.style.opacity = '0.5';
      };

      button.onclick = () => {

        if (currentSession === null) {

          device.requestSession({immersive: true, exclusive: true /* DEPRECATED */}).then(onSessionStarted);

        } else {

          currentSession.end();

        }

      };

      renderer.vr.setDevice(device);

    }

    function showVRNotFound() {

      button.style.display = '';

      button.style.cursor = 'auto';
      button.style.left = 'calc(50% - 75px)';
      button.style.width = '150px';
      button.style.bottom = '6rem';
      button.textContent = 'VR NOT FOUND';

      button.onmouseenter = null;
      button.onmouseleave = null;

      button.onclick = null;

      renderer.vr.setDevice(null);

    }

    function stylizeElement(element) {

      element.style.position = 'absolute';
      element.style.bottom = '20px';
      element.style.padding = '12px 6px';
      element.style.border = '1px solid #fff';
      element.style.borderRadius = '4px';
      element.style.background = 'rgba(0,0,0,0.1)';
      element.style.color = '#fff';
      element.style.font = 'normal 13px sans-serif';
      element.style.textAlign = 'center';
      element.style.opacity = '0.5';
      element.style.outline = 'none';
      element.style.zIndex = '999';

    }

    if ('xr' in navigator) {

      button = document.createElement('button');
      button.style.display = 'none';

      stylizeElement(button);
      // @ts-ignore
      navigator.xr.requestDevice().then((device) => {

        device.supportsSession({immersive: true, exclusive: true /* DEPRECATED */})
          .then(() => {
            showEnterXR(device);
          })
          .catch(showVRNotFound);

      }).catch(showVRNotFound);

      return button;

    } else if ('getVRDisplays' in navigator) {
      button = document.createElement('button');
      button.style.display = 'none';
      stylizeElement(button);

      window.addEventListener('vrdisplayconnect', (event) => {
        // @ts-ignore
        showEnterVR(event.display);
      }, false);

      window.addEventListener('vrdisplaydisconnect', (event) => {
        showVRNotFound();
      }, false);

      window.addEventListener('vrdisplaypresentchange', (event) => {
        // @ts-ignore
        button.textContent = event.display.isPresenting ? 'EXIT VR' : 'ENTER VR';
      }, false);

      window.addEventListener('vrdisplayactivate', (event) => {
        // @ts-ignore
        event.display.requestPresent([{source: renderer.domElement}]);
      }, false);

      navigator.getVRDisplays()
        .then((displays) => {

          if (displays.length > 0) {

            showEnterVR(displays[0]);

          } else {

            showVRNotFound();

          }

        }).catch(showVRNotFound);

      return button;

    } else {
      const message = document.createElement('a');
      message.href = 'https://webvr.info';
      message.innerHTML = 'WEBVR NOT SUPPORTED';

      message.style.left = 'calc(50% - 90px)';
      message.style.width = '180px';
      message.style.textDecoration = 'none';

      stylizeElement(message);

      return message;

    }

  }


}
