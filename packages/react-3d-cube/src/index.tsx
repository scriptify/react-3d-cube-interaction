import React, { ReactNode, useCallback, useEffect, useState } from 'react';
import {
  controlElementContainer,
  controlElement,
  cubeFace,
  cubeFaceFront,
  cubeFaceBack,
  cubeFaceRight,
  cubeFaceLeft,
  cubeFaceTop,
  cubeFaceBottom,
  // rotateIcon,
  // rotateIconHorizontal,
  // rotateIconVertical,
} from './index.module.css';
import { rotateToCubeSide } from './util/animate';
import {
  ControlElementRotation,
  calculateElementRotation,
  CalculateElementRotationResult,
  sanitizeRotation,
  snapRotation,
} from './util/math';
import {
  AllPointerEventTypes,
  NormalizedInteractionEvent,
  normalizePointerEvent,
} from './util/pointer-events';
import usePinch, {
  CONTAINER_WIDTH_ZOOM_FACTORS,
  UsePinchParams,
} from './util/usePinch';

// import rotateIconImg from './rotate.svg';

interface Props extends Pick<UsePinchParams, 'minZoom' | 'maxZoom'> {
  /**
   * Element on which to bind
   * click/touch listeners.
   * Defaults to document.
   */
  interactionElement?: HTMLElement;
  initialRotation?: ControlElementRotation;
  /**
   * Size of the cube.
   * Must be an __absolute__
   * CSS Value, e.g. px, em, vh, etc.
   * Defaults to 120px
   */
  size?: string;
  /**
   * Called when rotation changes.
   * X rotation is a value between -90° and 0°
   * Y rotation is a value between 0° and 360°
   */
  onRotationChange?: (p: ControlElementRotation) => void;
  /**
   * Returns a scaled value:
   * 10 = width of interactionElement
   */
  onZoomChange?: (p: number) => void;
  classnames?: Partial<{
    cubeFace: string;
    cubeFaceFront: string;
    cubeFaceBack: string;
    cubeFaceRight: string;
    cubeFaceLeft: string;
    cubeFaceTop: string;
    cubeFaceBottom: string;
  }>;
  /**
   * Defaults to german cube
   * face descriptors
   */
  cubeFaceChildren?: {
    front: ReactNode;
    back: ReactNode;
    right: ReactNode;
    left: ReactNode;
    top: ReactNode;
    bottom: ReactNode;
  };
}

const OrbitInteractions: React.FC<Props> = ({
  interactionElement,
  size = '130px',
  onRotationChange = () => {},
  onZoomChange = () => {},
  classnames,
  initialRotation = {
    rotX: 0,
    rotY: 0,
  },
  cubeFaceChildren = {
    back: 'hinten',
    bottom: '',
    front: 'vorne',
    left: 'links',
    right: 'rechts',
    top: 'oben',
  },
  ...props
}) => {
  const [elemRotation, setRotationState] = useState<ControlElementRotation>(
    sanitizeRotation(initialRotation),
  );

  const [faceH, setFaceH] = useState<number>(0);

  const { zoom, isPinching } = usePinch({
    interactionElement,
    onZoomEnd: (zoom) => onZoomChange(zoom.absoluteZoom),
    ...props,
  });

  const rotateToBack = useCallback(() => {
    rotateToCubeSide({
      currentRotation: elemRotation,
      onRotationChange: setRotationState,
      side: 'back',
    });
  }, [elemRotation, setRotationState]);

  const rotateToFront = useCallback(() => {
    rotateToCubeSide({
      currentRotation: elemRotation,
      onRotationChange: setRotationState,
      side: 'front',
    });
  }, [elemRotation, setRotationState]);

  const rotateToLeft = useCallback(() => {
    rotateToCubeSide({
      currentRotation: elemRotation,
      onRotationChange: setRotationState,
      side: 'left',
    });
  }, [elemRotation, setRotationState]);

  const rotateToRight = useCallback(() => {
    rotateToCubeSide({
      currentRotation: elemRotation,
      onRotationChange: setRotationState,
      side: 'right',
    });
  }, [elemRotation, setRotationState]);

  const rotateToTop = useCallback(() => {
    rotateToCubeSide({
      currentRotation: elemRotation,
      onRotationChange: setRotationState,
      side: 'top',
    });
  }, [elemRotation, setRotationState]);

  useEffect(() => {
    if (!interactionElement || isPinching) return;
    let pointerStartEvent: NormalizedInteractionEvent | undefined = undefined;
    let currRot: CalculateElementRotationResult | undefined = undefined;

    const { width: elemWidth } = interactionElement.getBoundingClientRect();

    const onPointerDown = (event: AllPointerEventTypes) => {
      const e = normalizePointerEvent(event);
      pointerStartEvent = e;
    };

    const onPointerMove = (event: AllPointerEventTypes) => {
      const e = normalizePointerEvent(event);
      if (pointerStartEvent) {
        const addRot = calculateElementRotation({
          startPos: {
            x: pointerStartEvent.clientX,
            y: pointerStartEvent.clientY,
          },
          currentPos: {
            x: e.clientX,
            y: e.clientY,
          },
          elemWidth,
        });
        pointerStartEvent = e;
        setRotationState((lastRot) => {
          const sanitizedRot = sanitizeRotation({
            rotX: lastRot.rotX + addRot.rotX,
            rotY: lastRot.rotY + addRot.rotY,
          });

          currRot = {
            ...addRot,
            ...sanitizedRot,
          };
          return currRot;
        });
      }
    };

    const onInteractionEnd = (event: AllPointerEventTypes) => {
      pointerStartEvent = undefined;
      if (currRot) {
        const snappedRot = snapRotation(currRot);
        currRot = {
          ...currRot,
          ...snappedRot,
        };
        onRotationChange(snappedRot);
        setRotationState(snappedRot);
      }
    };

    interactionElement.addEventListener('touchstart', onPointerDown);
    interactionElement.addEventListener('mousedown', onPointerDown);
    interactionElement.addEventListener('touchmove', onPointerMove);
    interactionElement.addEventListener('mousemove', onPointerMove);
    interactionElement.addEventListener('touchend', onInteractionEnd);
    interactionElement.addEventListener('mouseup', onInteractionEnd);
    return () => {
      // Give touchend handlers chance to execute
      setTimeout(() => {
        interactionElement.removeEventListener('touchstart', onPointerDown);
        interactionElement.removeEventListener('mousedown', onPointerDown);
        interactionElement.removeEventListener('touchmove', onPointerMove);
        interactionElement.removeEventListener('touchend', onInteractionEnd);
        interactionElement.removeEventListener('mouseleave', onInteractionEnd);
        interactionElement.removeEventListener('mousemove', onPointerMove);
        interactionElement.removeEventListener('mouseup', onInteractionEnd);
      }, 0);
    };
  }, [interactionElement, isPinching]);

  return (
    <div
      className={controlElementContainer}
      style={
        {
          '--size': size,
          '--zoomFactor': zoom.relativeZoom / CONTAINER_WIDTH_ZOOM_FACTORS + 1,
          '--rotY': `${elemRotation.rotY}deg`,
          '--rotX': `${elemRotation.rotX}deg`,
          '--fontSize': `${faceH / 4.4}px`,
        } as any
      }
    >
      {/* <div className={`${rotateIcon} ${rotateIconHorizontal}`}>
        <img src={rotateIconImg} alt="Rotate" />
      </div>
      <div className={`${rotateIcon} ${rotateIconVertical}`}>
        <img src={rotateIconImg} alt="Rotate" />
      </div> */}
      <div className={controlElement}>
        <div
          onClick={rotateToFront}
          className={`${cubeFace} ${cubeFaceFront} ${classnames?.cubeFace} ${classnames?.cubeFaceFront}`}
          ref={(elem) => {
            if (elem && faceH === 0) {
              const { height } = elem.getBoundingClientRect();
              setFaceH(height);
            }
          }}
        >
          {cubeFaceChildren.front}
        </div>
        <div
          onClick={rotateToBack}
          className={`${cubeFace} ${cubeFaceBack} ${classnames?.cubeFace} ${classnames?.cubeFaceBack}`}
        >
          {cubeFaceChildren.back}
        </div>
        <div
          onClick={rotateToRight}
          className={`${cubeFace} ${cubeFaceRight} ${classnames?.cubeFace} ${classnames?.cubeFaceRight}`}
        >
          {cubeFaceChildren.right}
        </div>
        <div
          onClick={rotateToLeft}
          className={`${cubeFace} ${cubeFaceLeft} ${classnames?.cubeFace} ${classnames?.cubeFaceLeft}`}
        >
          {cubeFaceChildren.left}
        </div>
        <div
          onClick={rotateToTop}
          className={`${cubeFace} ${cubeFaceTop} ${classnames?.cubeFace} ${classnames?.cubeFaceTop}`}
        >
          {cubeFaceChildren.top}
        </div>
        <div
          className={`${cubeFace} ${cubeFaceBottom} ${classnames?.cubeFace} ${classnames?.cubeFaceBottom}`}
        >
          {cubeFaceChildren.bottom}
        </div>
      </div>
    </div>
  );
};

export default OrbitInteractions;

export { ControlElementRotation };
