import './BioBox.css';

const BioBox = ({persona}) => {
  return (
    <div className="bio-box">
        <div className="character-image">
            <img src={persona.image} alt="logo" />
        </div>
        <div className="character-info">
            <div className="character-name">{persona.name}</div>
            <div className="character-description">{persona.description}</div>
        </div>
    </div>
  );
};

export default BioBox;
