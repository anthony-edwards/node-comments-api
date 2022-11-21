module.exports.mapComment = (source) => {
  return {
    id: source._id,
    description: source.description
  }
}