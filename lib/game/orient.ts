import { Matrix4, Quaternion, Vector3 } from 'three'

const Y = new Vector3(0, 1, 0)
const tmpQ = new Quaternion()
const tmpX = new Vector3()
const tmpZ = new Vector3()
const tmpM = new Matrix4()

export function surfaceQuaternion(up: Vector3, yaw = 0, out = new Quaternion()) {
  out.setFromUnitVectors(Y, up)
  if (yaw) out.multiply(tmpQ.setFromAxisAngle(Y, yaw))
  return out
}

/** Orient so local +Y = up and local +Z faces toward the given point on the sphere. */
export function facingQuaternion(up: Vector3, toward: Vector3, out = new Quaternion()) {
  tmpZ.copy(toward).sub(up)
  tmpZ.addScaledVector(up, -tmpZ.dot(up))
  if (tmpZ.lengthSq() < 1e-8) return null
  tmpZ.normalize()
  tmpX.crossVectors(up, tmpZ)
  tmpM.makeBasis(tmpX, up, tmpZ)
  return out.setFromRotationMatrix(tmpM)
}
